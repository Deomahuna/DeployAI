import "./AuthBackground.css";

// Prend la première image trouvée dans src/assets/auth/
const found = import.meta.glob("../../assets/auth/*.{jpg,jpeg,png,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});
const image = Object.keys(found).sort().map((k) => found[k])[0];

function AuthBackground() {
  return (
    <div
      className={image ? "auth-bg" : "auth-bg auth-bg-plain"}
      style={image ? { backgroundImage: `url(${image})` } : undefined}
      aria-hidden="true"
    />
  );
}

export default AuthBackground;