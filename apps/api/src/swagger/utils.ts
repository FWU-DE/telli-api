import { RouteHandlerDefinition } from "@/handlers";

export function generateOpenApiPaths(
  routes: Array<RouteHandlerDefinition>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    {} as Record<string, any>,
  );

  return result;
}
