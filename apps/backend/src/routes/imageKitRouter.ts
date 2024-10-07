import { Router } from "express";
import ImageKit from 'imagekit'

const router = Router();

const imagekit = new ImageKit({
  publicKey: "public_TgB5AGA3AeEiZhn3/24RR02eNbo=",
  privateKey: "private_g3JYRuGQ28uiCnLB8/WbmIERHe8=",
  urlEndpoint: "https://ik.imagekit.io/1q7keivsfku/",
});

router.get("/signature", (req, res) => {
  const authenticationParameters = imagekit.getAuthenticationParameters();
  console.log(authenticationParameters);
  res.json(authenticationParameters);
});

export default router;
