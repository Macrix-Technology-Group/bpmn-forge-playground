import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/generate": [
      "./node_modules/@macrix-technology-group/bpmn-forge/prompts/**",
    ],
  },
};

export default nextConfig;
