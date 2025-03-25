// "use client";
// import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
// import {
//   WalletModalProvider,
//   WalletMultiButton,
// } from "@solana/wallet-adapter-react-ui";
// import "@solana/wallet-adapter-react-ui/styles.css";
// import { useParams } from "next/navigation";
// import { useEffect, useState } from "react";
// import OrderConfirmation from "@/components/OrderConfirmation";

// const ReleaseFunds = () => {
//   const { userId } = useParams(); // Get userId from the route
//   const [cart, setCart] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch cart data from the database
//   useEffect(() => {
//     const fetchCartData = async () => {
//       if (!userId) return; // Ensure userId is available

//       try {
//         const response = await fetch(`/api/prisma/cart/getCart/${userId}`);
//         if (!response.ok) {
//           throw new Error("Failed to fetch cart data");
//         }
//         const data = await response.json();
//         setCart(data);
//       } catch (err) {
//         console.error("Error fetching cart data:", err);
//         setError("Failed to load cart data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchCartData();
//   }, [userId]);

//   // Filter pending items
//   const pendingItems = cart.filter((item) => item.escrowStatus === "pending");

//   return (
//     <>
//       <div className="bg-black min-h-screen text-gray-50 flex flex-col justify-center items-center">
//         <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
//           <WalletProvider wallets={[]} autoConnect>
//             <WalletModalProvider>
//               <WalletMultiButton />
//               <div className="mt-8 w-full max-w-4xl p-6">
//                 <h1 className="text-3xl font-bold mb-6">Release Funds</h1>
//                 {loading ? (
//                   <p className="text-gray-400">Loading cart data...</p>
//                 ) : error ? (
//                   <p className="text-red-500">{error}</p>
//                 ) : pendingItems.length > 0 ? (
//                   <div className="space-y-4">
//                     {pendingItems.map((item, index) => (
//                       <div
//                         key={index}
//                         className="bg-gray-800 p-4 rounded-lg shadow-md"
//                       >
//                         <h2 className="text-xl font-semibold">
//                           {item.productName}
//                         </h2>
//                         <p className="text-gray-400">
//                           Quantity: {item.quantity}
//                         </p>
//                         <p className="text-gray-400">
//                           Price: {item.price} SOL
//                         </p>
//                         <p className="text-yellow-400">Status: Pending</p>
//                         <OrderConfirmation
                         
//                         />
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <p className="text-gray-400">No pending items in the cart.</p>
//                 )}
//               </div>
//             </WalletModalProvider>
//           </WalletProvider>
//         </ConnectionProvider>
//       </div>
//     </>
//   );
// };

// export default ReleaseFunds;