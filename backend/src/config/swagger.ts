import swaggerJsdoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "ECO-CYCLE-PAY API",
            version: "1.0.0",
            description:
                "API documentation for ECO-CYCLE-PAY - Enyata × Interswitch Buildathon 2026",
            contact: {
                name: "ECO-CYCLE-PAY Team",
            },
        },
        servers: [
            {
                url: process.env.API_URL || "http://localhost:5000",
                description: "Development Server",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT",
                },
            },
        },
    },
    apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
