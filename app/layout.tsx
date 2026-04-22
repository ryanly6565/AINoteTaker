import Providers from "./providers";
import "@/styles/globals.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

export const metadata = {
  title: "Notare",
  description: "Note app",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}