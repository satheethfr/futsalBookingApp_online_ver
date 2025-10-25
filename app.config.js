export default {
  expo: {
    name: "futsal-booking-app",
    slug: "futsal-booking-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#ffffff",
      },
    },
    web: {
      favicon: "./assets/icon.png",
    },
    extra: {
      supabaseUrl: "https://oextjradcmdpcnxkzsxg.supabase.co",
      supabaseAnonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9leHRqcmFkY21kcGNueGt6c3hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4OTAwOTIsImV4cCI6MjA3NjQ2NjA5Mn0.cow4ZzHEXd9V4nVzA9vco0EGyY-PXRvxkSwn11cS0IY",
    },
  },
};
