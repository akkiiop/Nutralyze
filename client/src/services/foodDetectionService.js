import axios from "axios";
import { API_ENDPOINTS, handleServerError } from "../config/api";

export const detectFoodAndNutrition = async (imageUrl) => {
  try {
    // Convert the image URL to a Blob
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();

    // Prepare FormData for upload
    const formData = new FormData();
    formData.append("image", imageBlob, "meal.jpg");

    // Send to Node backend using API endpoint constant
    const response = await axios.post(API_ENDPOINTS.DETECT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
    });

    return {
      success: true,
      ...response.data, // Expecting: detectedFoods, nutrients, imageUrl
    };

  } catch (error) {
    console.error("Error detecting food:", error);
    return {
      success: false,
      ...handleServerError(error)
    };
  }
};
