import express from 'express'
import router from './src/routes'
import initDatabase from './src/db/mongoose'
import { initKafkaConsumer } from './src/kafka/kafka'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'

(async () => {
    const app = express()

    app.use(cors({
        origin: ['http://localhost:3000']
    }))

    app.use(bodyParser.json());
    
    app.use(bodyParser.urlencoded({ extended: true }));

    const PORT = process.env.PORT || 4000

    try {
        await initDatabase()
        initKafkaConsumer()
    } catch (error) {
        console.log('error line 20 ----->', error);
    }

    app.use(router)

    app.listen(PORT, () => {
        console.log(`Backend runnning on port ${PORT}`);
    })
})();


