import { type NextApiRequest, type NextApiResponse } from "next";
import { pushBTCpmt, sendBtcs } from "~/utils/utxo";
import type { PublicKey, SecretKey } from "@cmdcode/crypto-utils";
import { Address, Signer, Tap, Tx } from "@cmdcode/tapscript";
import { Buff } from "@cmdcode/buff-utils";
import * as fs from "fs";
import MockWallet from "~/utils/mock-wallet";
import { getTx } from "~/utils/transaction";
import config from "~/config";

const mockWallet = new MockWallet();

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    recipient: string;
    txid: string;
  };
}

const handler = async (req: ExtendedNextApiRequest, res: NextApiResponse) => {
  const txData = await getTx(req.body.txid);
  await mockWallet.init();
  console.log("mockWallet.fundingAddress", mockWallet.fundingAddress);
  console.log("txData", txData);
  if (txData.recipient !== mockWallet.fundingAddress)
    return res.status(400).json({ msg: "Please send some btcs" });
  if (txData.amount !== config.totalPrice)
    return res.status(400).send({ msg: "You deposit incorrect amount" });

  const imgdata = fs.readFileSync(`./img/1.png`);
  console.log("imgdata.length", imgdata.length);
  const marker = Buff.encode("ord");
  const mimetype = Buff.encode("image/png");

  const script = [
    mockWallet.pubkey,
    "OP_CHECKSIG",
    "OP_0",
    "OP_IF",
    marker,
    "01",
    mimetype,
    "OP_0",
    imgdata,
    "OP_ENDIF",
  ];
  const tapleaf = Tap.encodeScript(script as any[]);
  const [tpubkey, cblock] = Tap.getPubKey(mockWallet.pubkey as PublicKey, {
    target: tapleaf,
  });
  const address = Address.p2tr.fromPubKey(tpubkey, "testnet");

  console.log("tapleaf.length", tapleaf.length);

  const fee = (imgdata.length / 4 + 546) * 4 + 300;

  console.log("fee", fee);

  const txId = await sendBtcs(
    mockWallet,
    address,
    fee,
    req.body.txid,
    txData.amount
  );

  const txdata = Tx.create({
    vin: [
      {
        txid: txId,
        vout: 0,
        prevout: {
          value: fee,
          scriptPubKey: ["OP_1", tpubkey],
        },
      },
    ],
    vout: [
      {
        value: 546,
        scriptPubKey: Address.toScriptPubKey(req.body.recipient),
      },
    ],
  });

  const sig = Signer.taproot.sign(mockWallet.seckey as SecretKey, txdata, 0, {
    extension: tapleaf,
  });
  (txdata.vin[0] as any).witness = [sig, script as any[], cblock];

  const rawTx = Tx.encode(txdata).hex;

  console.log(rawTx);

  const tx = await pushBTCpmt(rawTx);

  return res.send(`${tx}i0`);
};

export default handler;
