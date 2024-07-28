import App from "../../components/App";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <>
            {children}
            <App />
        </>
    )
}