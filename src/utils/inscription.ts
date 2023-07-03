export interface IInscription {
  address: string;
  inscriptionId: string;
  inscriptionNumber: number;
  output: string;
  outputValue: number;
}

export const getInscriptions = async (
  address: string
): Promise<IInscription[]> => {
  const url = `https://unisat.io/${"testnet"}/wallet-api-v4/address/inscriptions?address=${address}&cursor=0&size=100
    `;
  const headers = {
    "X-Address": address,
    "X-Channel": "store",
    "X-Client": "UniSat Wallet",
    "X-Udid": "1SRcnclB8Ck3",
    "X-Version": "1.1.21",
  };

  const res = await fetch(url, { headers });
  const inscriptionDatas = await res.json();

  const inscriptions: IInscription[] = [];
  inscriptionDatas.result.list.forEach((inscriptionData: any) => {
    inscriptions.push({
      address: inscriptionData.address,
      inscriptionId: inscriptionData.inscriptionId,
      inscriptionNumber: inscriptionData.inscriptionNumber,
      output: inscriptionData.output,
      outputValue: inscriptionData.outputValue,
    });
  });

  return inscriptions;
};
