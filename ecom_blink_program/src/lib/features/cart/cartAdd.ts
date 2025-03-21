import axios from "axios";


interface CartDetail {
    userId: number;
  productName: string;
  imageUrl: string;
  description: string;
  price: number;
  quantity: number;
}


export const addItems = async (cartDetail: CartDetail) => {

    const response = await axios.post("/api/prisma/cart/add", {
      userId: cartDetail.userId,
      productName: cartDetail.productName,
      imageURL: cartDetail.imageUrl,
      description: cartDetail.description,
      price: cartDetail.price,
      quantity: cartDetail.quantity,
    });

    const result = await response.data;

    return result;
};
