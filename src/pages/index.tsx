import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import config from "~/config";
import "~/utils/types";

export default function Home() {
  const [inscriptionId, setInscriptionId] = useState("");

  const onMintBtnClicked = async () => {
    if (window.unisat === undefined)
      return alert("please install unisat wallet");
    try {
      const [address] = await window.unisat.requestAccounts();
      const txid = await window.unisat.sendBitcoin(
        "tb1pfeuvpua4s3v6yyfx3xyry3dwrdmt0h2h2pz60w6vfnxzj47whf9s4r6z78",
        config.totalPrice
      );

      const res = await axios.post("/api/inscribe", {
        recipient: address,
        txid,
      });

      setInscriptionId(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        {inscriptionId ? (
          <div className="flex gap-2">
            <p>inscription id:</p>
            <Link
              href={`https://testnet.cleverord.com/inscription/${inscriptionId}`}
            >
              {inscriptionId}
            </Link>
          </div>
        ) : (
          <></>
        )}
        <button
          className="rounded-lg border-2 px-6 py-4"
          onClick={() => onMintBtnClicked()}
        >
          mint
        </button>
      </main>
    </>
  );
}
