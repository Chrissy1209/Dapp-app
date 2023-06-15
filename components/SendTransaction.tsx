import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  Button,
  Alert,
} from "react-native";
import React, { useState, useCallback, useMemo } from "react";
import "react-native-get-random-values";
import "@ethersproject/shims";
import { ethers } from "ethers";

const ACCESS_API = process.env.ACCESS_API;
const MNEMONIC = process.env.MNEMONIC;

type SendTransactionProps = {
  balance: number;
  defaultNonce: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<string>>;
  setFetchDefaultDataToggle: React.Dispatch<React.SetStateAction<boolean>>;
};
const SendTransaction = ({
  balance,
  defaultNonce,
  setCurrentPage,
  setFetchDefaultDataToggle,
}: SendTransactionProps) => {
  const [sendAddress, setSendAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendNonce, setSendNonce] = useState("");

  const [isSendAddressVerified, setSendAddressVerified] = useState(false);
  const [isSendingTransaction, setSendingTransaction] = useState(false);

  const isSendAddressRejected = useMemo(() => {
    if (sendAddress === "") return null;
    if (isSendAddressVerified) return null;
    return <Text style={styles.warningText}>接收位址錯誤</Text>;
  }, [sendAddress, isSendAddressVerified]);

  const isSubmitAvailable = useMemo(
    () => balance >= Number(sendAmount),
    [balance, sendAmount]
  );

  const handleSendAddressChange = useCallback((value: string) => {
    setSendAddress(value);
    try {
      ethers.utils.getAddress(value);
      setSendAddressVerified(true);
    } catch (err) {
      console.log(err);
    }
  }, []);

  const handleSendAmountChange = useCallback((amount: string) => {
    if (!/^\d*\.?\d*$/.test(amount)) return;

    // . -> 0.
    if (amount === ".") setSendAmount(`0${amount}`);
    // 00 -> 0
    else if (amount === "00") setSendAmount("0");
    // 00 -> 0 || 01 -> 1
    else if (amount[0] === "0" && amount[1] !== "." && amount.length === 2)
      setSendAmount(amount.slice(1, 2));
    else {
      setSendAmount(amount);
    }
  }, []);

  const handleSendNonceChange = useCallback((nonce: string) => {
    if (nonce === "") setSendNonce("");
    if (!/^\d+$/.test(nonce)) return;

    // 00 -> 0 || 01 -> 1
    if (nonce[0] === "0" && nonce[1] !== "." && nonce.length === 2)
      setSendNonce(nonce.slice(1, 2));
    else {
      setSendNonce(nonce);
    }
  }, []);

  const handlePageChange = useCallback(() => {
    setCurrentPage("account");
  }, [setCurrentPage]);

  const handleSendAddressEmtpy = useCallback(() => {
    setSendAddressVerified(false);
    setSendAmount("");
    setSendNonce("");
    setSendAddress("");
  }, []);

  const handleSendTransaction = useCallback(() => {
    setSendingTransaction(true);

    const sendingTransaction = async () => {
      if (sendAmount === "" || sendAmount === "0.") setSendAmount("0");
      if (sendNonce === "") setSendNonce(String(defaultNonce));
      else if (Number(sendNonce) > defaultNonce) {
        Alert.alert("交易被排隊等待", "確認並返回首頁", [
          { text: "確認", onPress: () => setCurrentPage("account") },
        ]);
      }

      const provider = new ethers.providers.JsonRpcProvider(
        `https://linea-goerli.infura.io/v3/${ACCESS_API}`
      );

      const mnemonicWallet = ethers.Wallet.fromMnemonic(MNEMONIC);
      const signer = new ethers.Wallet(mnemonicWallet.privateKey, provider);

      try {
        const gasPrice = await provider.getGasPrice();
        const maxFeePerGas = gasPrice.mul(2);
        const maxPriorityFeePerGas = gasPrice;

        const sendTransaction = await signer.sendTransaction({
          to: sendAddress,
          value: sendAmount
            ? ethers.utils.parseEther(sendAmount)
            : ethers.constants.Zero,
          nonce: sendNonce ? ethers.BigNumber.from(sendNonce) : defaultNonce,
          maxFeePerGas: maxFeePerGas,
          maxPriorityFeePerGas: maxPriorityFeePerGas,
        });
        await sendTransaction.wait();
        setFetchDefaultDataToggle((pre) => !pre);
        setSendingTransaction(false);
        setCurrentPage("account");
      } catch (err) {
        setSendingTransaction(false);
        Alert.alert("交易失敗", "你確定要結束本次交易嗎？", [
          { text: "確定", onPress: () => setCurrentPage("account") },
        ]);
        console.log(err);
      }
    };
    sendingTransaction();
  }, [sendAmount, sendNonce, setCurrentPage]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send to</Text>
      {isSendAddressVerified ? (
        <View style={verifiedStyle.container}>
          <View style={verifiedStyle.addressBox}>
            <Text style={verifiedStyle.address}>{sendAddress}</Text>
            <Text
              style={verifiedStyle.sendAddressEmtpy}
              onPress={handleSendAddressEmtpy}
            >
              X
            </Text>
          </View>
          <Text style={verifiedStyle.verifiedText}>偵測到錢包位址！</Text>

          <View style={verifiedStyle.transactionInfoBox}>
            <View style={verifiedStyle.transitionInfoRow}>
              <Text style={verifiedStyle.infoTitle}>資產：</Text>
              <Text style={verifiedStyle.infoText}>
                {balance === 0 ? 0 : balance} ETH
              </Text>
            </View>
            <View style={verifiedStyle.transitionInfoRow}>
              <Text style={verifiedStyle.infoTitle}>Amount:</Text>
              <TextInput
                keyboardType="numeric"
                onChangeText={handleSendAmountChange}
                value={sendAmount}
                placeholder="0"
                style={verifiedStyle.inputText}
                returnKeyType="done"
              />
            </View>
            <View
              style={[
                verifiedStyle.transitionInfoRow,
                verifiedStyle.marginBottom,
              ]}
            >
              <Text style={verifiedStyle.infoTitle}>Nonce:</Text>
              <TextInput
                keyboardType="number-pad"
                onChangeText={handleSendNonceChange}
                value={sendNonce}
                placeholder={String(defaultNonce)}
                style={verifiedStyle.inputText}
                returnKeyType="done"
              />
            </View>
            {!isSubmitAvailable && (
              <Text style={verifiedStyle.warningText}>資金不足</Text>
            )}
            {isSendingTransaction && (
              <Text style={verifiedStyle.processingText}>交易處理中 . . .</Text>
            )}
          </View>

          <View style={verifiedStyle.buttonGroup}>
            <TouchableOpacity
              onPress={handlePageChange}
              style={verifiedStyle.button}
            >
              <Text style={verifiedStyle.cancelButtonText}>返回</Text>
            </TouchableOpacity>

            {!isSubmitAvailable || isSendingTransaction ? (
              <View style={verifiedStyle.disabledButton}>
                <Button disabled title="確認" />
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleSendTransaction}
                style={[verifiedStyle.button, verifiedStyle.confirmButton]}
              >
                <Text style={verifiedStyle.confirmButtonText}>確認</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View>
          <TextInput
            onChangeText={handleSendAddressChange}
            value={sendAddress}
            placeholder="搜尋公開地址(0x)"
            style={styles.addressInputBox}
            returnKeyType="done"
          />
          <View style={styles.infoContent}>
            <View style={styles.rejectedText}>{isSendAddressRejected}</View>
            <Text onPress={handlePageChange} style={styles.cancelButton}>
              返回
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};
export default SendTransaction;

const verifiedStyle = StyleSheet.create({
  container: {
    flex: 1,
  },
  addressBox: {
    borderColor: "#4D80E6",
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 8,
    marginBottom: 12,
  },
  address: {
    wordBreak: "break-all",
    color: "#4D80E6",
    flex: 1,
  },
  sendAddressEmtpy: {
    paddingLeft: 16,
    paddingVertical: 8,
  },
  verifiedText: {
    color: "#36BF36",
  },
  warningText: {
    color: "red",
    textAlign: "right",
  },
  processingText: {
    color: "dimgray",
    textAlign: "right",
    fontSize: 16,
    fontWeight: "500",
  },
  transactionInfoBox: {
    flex: 1,
    marginTop: 48,
  },
  transitionInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  marginBottom: {
    marginBottom: 24,
  },
  infoTitle: {
    minWidth: 100,
    fontWeight: "500",
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    color: "#05050561",
    fontSize: 18,
    textAlign: "right",
  },
  inputText: {
    flex: 1,
    fontSize: 18,
    textAlign: "center",
    backgroundColor: "#fff",
    borderRadius: 4,
    marginHorizontal: 24,
    paddingVertical: 4,
  },
  buttonGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  button: {
    borderColor: "#007AFF",
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: "center",
    paddingHorizontal: 60,
    paddingVertical: 8,
  },
  confirmButton: {
    backgroundColor: "#007AFF",
  },
  disabledButton: {
    borderColor: "#737373",
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: "#737373",
    paddingHorizontal: 52,
    paddingVertical: 0,
  },
  cancelButtonText: {
    fontSize: 18,
    color: "#007AFF",
  },
  confirmButtonText: {
    fontSize: 18,
    color: "#fff",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "400",
    textAlign: "center",
    paddingBottom: 16,
  },
  addressInputBox: {
    backgroundColor: "#fff",
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
  },
  infoContent: {
    flexDirection: "row",
  },
  rejectedText: {
    flex: 1,
  },
  warningText: {
    color: "red",
  },
  cancelButton: {
    textAlign: "right",
    color: "#007AFF",
    paddingVertical: 8,
    paddingLeft: 20,
  },
});
