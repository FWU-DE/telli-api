import { RouteHandlerDefinition } from "@/handlers";

export function generateOpenApiPaths(
  routes: Array<RouteHandlerDefinition>,
): Record<string, any> {
  const result = routes.reduce(
    (paths, route) => {
      const { path, method, schema } = route;
      const lowerMethod = method.toLowerCase();

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

  return result;
}
