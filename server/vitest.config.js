import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        env: {
            NODE_ENV: 'test',
            JWT_SECRET: 'testsecret',
            MONGO_URI: 'mongodb://localhost:27017/test'
        },
        // Prevent tests from hanging if there are unclosed handles
        teardownTimeout: 1000,
    },
});
