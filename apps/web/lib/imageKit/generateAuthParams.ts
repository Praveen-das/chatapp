import ImageKit from "imagekit";

const imagekit = new ImageKit({
  publicKey: "public_TgB5AGA3AeEiZhn3/24RR02eNbo=",
  privateKey: "private_g3JYRuGQ28uiCnLB8/WbmIERHe8=",
  urlEndpoint: "https://ik.imagekit.io/1q7keivsfku/",
});

export async function getAuthenticationParameters() {
    return imagekit.getAuthenticationParameters();
}

