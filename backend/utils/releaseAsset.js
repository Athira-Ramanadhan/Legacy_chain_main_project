const Asset = require("../models/Asset");
const contract = require("../config/blockchain");

const releaseAsset = async (asset) => {
  const tx = await contract.verifyDeathAndRelease(asset.blockchainId);
  const receipt = await tx.wait();

  asset.status = "RELEASED";
  asset.releasedAt = new Date();
  asset.txHash = receipt.hash;

  await asset.save();

  return receipt.hash;
};

module.exports = releaseAsset;
