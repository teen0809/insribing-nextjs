import { Address, Signer, Tx } from "@cmdcode/tapscript";
import config from "../config";
import { type SecretKey } from "@cmdcode/crypto-utils";
import axios, { type AxiosError } from "axios";
import type MockWallet from "./mock-wallet";

interface IUtxo {
  txid: string;
  vout: number;
  value: number;
}

const axiosInstance = axios.create({});

export const getUtxos = async (address: string): Promise<IUtxo[]> => {
  const url = `https://mempool.space/${config.mempoolNetwork}api/address/${address}/utxo`;

  const res = await axios.get(url);
  const utxos: IUtxo[] = [];
  res.data.forEach((utxoData: any) => {
    utxos.push({
      txid: utxoData.txid,
      vout: utxoData.vout,
      value: utxoData.value,
    });
  });
  return utxos;
};

export async function sendBtcs(
  mockWallet: MockWallet,
  address: string,
  amount: number,
  txid: string,
  txAmount: number
): Promise<string> {
  // const utxos = await getUtxos(mockWallet.fundingAddress as string);
  // if (utxos.length === 0) throw new Error("Can not get utxos from address");
  // const utxo = utxos.find((item) => item.value >= amount + 300);
  // if (!utxo) throw new Error("you don't have enough balance for inscribing");
  const tx = Tx.create({
    vin: [
      {
        txid: txid,
        vout: 0,
        prevout: {
          value: txAmount,
          scriptPubKey: ["OP_1", mockWallet.init_tapkey as string],
        },
      },
    ],
    vout: [
      {
        value: amount,
        scriptPubKey: ["OP_1", Address.p2tr.decode(address).hex],
      },
      {
        value: txAmount - 300 - amount,
        scriptPubKey: [
          "OP_1",
          Address.p2tr.decode(mockWallet.fundingAddress as string).hex,
        ],
      },
    ],
  });

  const signature = await Signer.taproot.sign(
    (mockWallet.seckey as SecretKey).raw,
    tx,
    0,
    {
      extension: mockWallet.init_leaf,
    }
  );
  (tx.vin[0] as any).witness = [
    signature.hex,
    mockWallet.init_script as any[],
    mockWallet.init_cblock as string,
  ];

  const rawTx = Tx.encode(tx).hex;
  const txId: string = (await pushBTCpmt(rawTx)) as string;
  if (!txId) throw new Error("Failed to send btcs");
  return txId;
}

export async function pushBTCpmt(rawtx: any) {
  const txid = await postData(
    "https://mempool.space/" + config.mempoolNetwork + "api/tx",
    rawtx
  );

  await waitSeconds(2000);

  return txid;
}

async function waitSeconds(time: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

async function postData(
  url: string,
  json: any,
  content_type = "text/plain",
  apikey = ""
): Promise<string | undefined> {
  while (1) {
    try {
      const headers: any = {};
      if (content_type) headers["Content-Type"] = content_type;
      if (apikey) headers["X-Api-Key"] = apikey;
      const res = await axiosInstance.post(url, json, {
        headers,
      });

      return res.data;
    } catch (err) {
      const axiosErr = err as AxiosError;
      console.log("axiosErr.response?.data", axiosErr.response?.data);
      if (
        !(axiosErr.response?.data as string).includes(
          'sendrawtransaction RPC error: {"code":-26,"message":"too-long-mempool-chain,'
        )
      )
        throw new Error("Got an err when push tx");
      await waitSeconds(20000);
    }
  }
}
