import "./globals.css";
import { Karla } from "next/font/google";
import SessionWrapper from "../components/SessionWrapper";
import StoreProvider from "./StoreProvider";


const karla = Karla({
  subsets: ["latin"],
  weight: ["400", "700"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>My eCommerce Chatbot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={karla.className}>
        
          <SessionWrapper>
            <StoreProvider>{children}</StoreProvider>
          </SessionWrapper>
      
      </body>
    </html>
  );
}