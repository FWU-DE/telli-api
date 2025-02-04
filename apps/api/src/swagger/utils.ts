import { RouteHandlerDefinition } from "@/handlers";

export function generateOpenApiPaths(
  routes: Array<RouteHandlerDefinition>,
): Record<string, any> {
  const result = routes.reduce(
    (paths, route) => {
      const { path, method, schema } = route;
      const lowerMethod = method.toLowerCase(); // Convert method to lowercase (OpenAPI spec uses lowercase)

      if (!paths[path]) {
        paths[path] = {};
      }

      paths[path][lowerMethod] = {
        ...schema,
      };

      return paths;
    },
    {} as Record<string, any>,
  );
  console.debug({ result: JSON.stringify(result) });

  return result;
}
