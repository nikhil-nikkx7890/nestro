import express from "express";
import cors from "cors";
import categoryRoutes from "./routes/category.routes.js";
import roomTypeRoutes from "./routes/roomType.routes.js";
import brandRoutes from "./routes/brand.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/categories",categoryRoutes);
app.use("/api/room-types",roomTypeRoutes);
app.use("/api/brands",brandRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Nestro backend api is running successfully...."
    })
})

export default app;
