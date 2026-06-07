/** @type {import('next').NextConfig} */

module.exports = {
  transpilePackages: ["@repo/ui"],
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: "/api/external/:path*",
        destination: "http://gateway-alb-313359290.ap-south-1.elb.amazonaws.com*",
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:3000", "qw8d3s7n-3000.inc1.devtunnels.ms"],
    },
    turbo: {
      rules: {
        "*.svg": {
          loaders: [
            {
              loader: "@svgr/webpack",
              options: {
                icon: true,
              },
            },
          ],
          as: "*.js",
        },
      },
    },
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [{ loader: "@svgr/webpack", options: { icon: true } }],
    });

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "**.**.com",
      },
    ],
  },
};
