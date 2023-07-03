import axios from "axios";

interface Tx {
  sender: string;
  recipient: string;
  amount: number;
}

export const getTx = async (txid: string): Promise<Tx> => {
  console.log(`https://mempool.space/testnet/api/tx/${txid}`);
  const res = await axios.get(`https://mempool.space/testnet/api/tx/${txid}`);
  const { data } = res;
  return {
    sender: data.vin[0].prevout.scriptpubkey_address,
    recipient: data.vout[0].scriptpubkey_address,
    amount: data.vout[0].value,
  };
};
