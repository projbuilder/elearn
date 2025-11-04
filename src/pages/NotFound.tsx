const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a 
          href="/" 
          className="inline-block px-6 py-3 bg-gradient-to-r from-fl-primary to-fl-secondary text-white rounded-lg font-medium hover:shadow-glow transition-all"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;