import api from "./api";

export const scanPackageFood = async (barcode) => {
  try {
    const res = await api.post("/api/package-food/scan", {
      barcode: barcode.trim(),
    });
    return res.data;
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error("PRODUCT_NOT_FOUND");
    }
    throw new Error("API_FAILED");
  }
};
