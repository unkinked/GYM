import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"Gym Personal · Tu rutina, tu ritmo",description:"Tu espacio privado para entrenar, registrar tu progreso y descubrir nuevas variaciones.",manifest:"/manifest.webmanifest",icons:{icon:"/icon.svg",apple:"/icon-192.png"},appleWebApp:{capable:true,statusBarStyle:"black-translucent",title:"Gym Personal"}};
export const viewport:Viewport={width:"device-width",initialScale:1,themeColor:"#151813"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>;}
