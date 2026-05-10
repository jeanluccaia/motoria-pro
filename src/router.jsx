import { createContext, useContext, useState, useEffect } from "react";

const RouterCtx = createContext({ path: "/", navigate: () => {} });

export function Router({ children }) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  function navigate(to) {
    window.history.pushState({}, "", to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  return (
    <RouterCtx.Provider value={{ path, navigate }}>
      {children}
    </RouterCtx.Provider>
  );
}

export function useRouter() {
  return useContext(RouterCtx);
}

export function useNavigate() {
  return useContext(RouterCtx).navigate;
}

export function Link({ to, children, className, style, onClick }) {
  const navigate = useNavigate();
  function handleClick(e) {
    e.preventDefault();
    if (onClick) onClick(e);
    navigate(to);
  }
  return (
    <a href={to} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}
