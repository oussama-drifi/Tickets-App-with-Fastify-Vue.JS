import 'dotenv/config';
import { buildApp } from './src/app.js';

(async () => {
    const app = await buildApp({ logger: true });

    try {
        const port = process.env.PORT || 3000;

        await app.listen({ port, host: '0.0.0.0' });
        
        console.log(`Server listening on http://localhost:${port}`);
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
})();