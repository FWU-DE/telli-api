import { GoogleAuth } from "google-auth-library";
import OpenAI from "openai";
import { VertexAI } from "@google-cloud/vertexai";

import { LlmModel } from "@dgpt/db";
import { ImageGenerationFn } from "../types";

interface GoogleClientConfig {
  projectId: string;
  location: string;
  auth: GoogleAuth;
  vertexAI: VertexAI;
}

interface GoogleVertexPrediction {
  bytesBase64Encoded?: string;
}

interface GoogleVertexResponse {
  predictions?: GoogleVertexPrediction[];
}

// Cache Google clients per model to avoid recreating auth instances
const googleClientCache = new Map<string, GoogleClientConfig>();

function createGoogleClient(model: LlmModel): GoogleClientConfig {
  if (model.setting.provider !== "google") {
    throw new Error("Invalid model configuration for Google");
  }

  const { projectId, location } = model.setting;
  const cacheKey = `${projectId}-${location}` as const;

  // Return cached client if available
  if (googleClientCache.has(cacheKey)) {
    return googleClientCache.get(cacheKey)!;
  }

  // Initialize Google Auth with automatic credential detection
  // The GOOGLE_APPLICATION_CREDENTIALS env var should point to the service account JSON
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  const vertexAI = new VertexAI({
    project: projectId,
    location: location,
  });

  const client = {
    projectId,
    location,
    auth,
    vertexAI,
  };

  // Cache the client for future requests
  googleClientCache.set(cacheKey, client);

  return client;
}

export function constructGoogleImageGenerationFn(
  model: LlmModel,
): ImageGenerationFn {
  const clientConfig = createGoogleClient(model);

  return async function getGoogleImageGeneration(
    params: Parameters<ImageGenerationFn>[0],
  ) {
    const { prompt } = params;
    const { projectId, location, auth } = clientConfig;

    try {
      // Get access token - GoogleAuth handles caching and refresh automatically
      const accessToken = await auth.getAccessToken();

      // Vertex AI Image Generation endpoint
      const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model.name}:predict`;

      // Prepare the request for Vertex AI Image Generation
      const requestBody = {
        instances: [
          {
            prompt: prompt,
          },
        ],
        parameters: {
          sampleCount: 1,
          aspectRatio: "1:1",
          safetyFilterLevel: "block_some",
          personGeneration: "allow_adult",
        },
      };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Handle token refresh issues specifically
        if (response.status === 401) {
          console.warn(
            "Authentication failed, token may have expired. GoogleAuth will handle refresh on next request.",
          );
        }

        throw new Error(
          `Google Image Generation failed: ${response.status} ${errorText}`,
        );
      }

      const result = (await response.json()) as GoogleVertexResponse;

      // Convert Google's response to OpenAI format
      if (result.predictions && result.predictions.length > 0) {
        const prediction = result.predictions[0];

        if (!prediction) {
          throw new Error("Invalid prediction data from Google Vertex AI");
        }

        // Google returns images as base64 encoded data
        const imageData = prediction.bytesBase64Encoded;

        if (!imageData) {
          throw new Error("No image data received from Google Vertex AI");
        }

        const openAIResponse: OpenAI.Images.ImagesResponse = {
          created: Math.floor(Date.now() / 1000),
          data: [
            {
              b64_json: imageData,
            },
          ],
        };

        return openAIResponse;
      } else {
        throw new Error("No image generated from Google Vertex AI");
      }
    } catch (error) {
      console.error("Google image generation error:", error);
      throw error;
    }
  };
}
