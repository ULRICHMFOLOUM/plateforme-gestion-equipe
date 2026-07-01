
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: "dzdjvzztk",
  api_key: "157281938544477",
  api_secret: "fJbULzhrZU4KL9bm434hXXrWWCk",
  secure: true,
});

async function main() {
  const dummyBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  try {
    console.log("Uploading...");
    const result = await cloudinary.uploader.upload(dummyBase64, {
      folder: "profiles",
      resource_type: "auto",
    });
    console.log("Success:", result.secure_url);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
