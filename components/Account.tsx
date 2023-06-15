import { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, TouchableOpacity, Text } from "react-native";
import {
  MaterialIcons,
  Feather,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import "react-native-get-random-values";
import "@ethersproject/shims";
import { ethers } from "ethers";
import SendTransaction from "./SendTransaction";

const ACCESS_API = process.env.ACCESS_API;
const address = process.env.ADDRESS;
const addressSliceOne = address.substring(0, 5) || "";
const addressSliceTwo = address.substring(38, 42) || "";

const Account = () => {
  const [balance, setBalance] = useState(0);
  const [defaultNonce, setDefaultNonce] = useState(0);

  const [currentPage, setCurrentPage] = useState("account");
  const [fetchDefaultDataToggle, setFetchDefaultDataToggle] = useState(false);

  const handleAddressCopy = useCallback(() => {
    Clipboard.setString(address);
  }, [address]);

  const handlePageChange = useCallback(() => {
    setCurrentPage("send");
  }, [setCurrentPage]);

  useEffect(() => {
    const getDefaultData = async () => {
      try {
        const provider = new ethers.providers.JsonRpcProvider(
          `https://linea-goerli.infura.io/v3/${ACCESS_API}`
        );
        const getBalance = await provider.getBalance(address);
        const formatBalance = Number(ethers.utils.formatEther(getBalance));
        if (formatBalance < 1) setBalance(Number(formatBalance.toFixed(9)));
        else setBalance(formatBalance);

        const getTransactionCount = await provider.getTransactionCount(address);
        setDefaultNonce(getTransactionCount);
      } catch (err) {
        console.log(err);
      }
    };
    getDefaultData();
  }, [fetchDefaultDataToggle]);

  return (
    <View style={styles.container}>
      {currentPage === "account" && (
        <>
          <View style={styles.accountInfoBox}>
            <Text style={styles.accountText}>Account 1</Text>
            <TouchableOpacity onPress={handleAddressCopy}>
              <View style={styles.addressBox}>
                <Text style={styles.address}>
                  {addressSliceOne}...{addressSliceTwo}
                </Text>
                <Feather name="copy" size={18} color="dimgray" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.subContainer}>
            <View style={styles.tokenIcon}>
              <MaterialCommunityIcons name="ethereum" size={44} color="black" />
            </View>
            <Text style={styles.balanceText}>
              {balance === 0 ? 0 : balance} tETH
            </Text>

            <View style={styles.iconGroup}>
              <View>
                <TouchableOpacity style={styles.icon}>
                  <MaterialIcons name="file-download" size={36} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.iconText}>買</Text>
              </View>
              <View>
                <TouchableOpacity
                  onPress={handlePageChange}
                  style={styles.icon}
                >
                  <Feather name="arrow-up-right" size={36} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.iconText}>發送</Text>
              </View>
              <View>
                <TouchableOpacity style={styles.icon}>
                  <MaterialIcons name="swap-horiz" size={36} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.iconText}>交換</Text>
              </View>
            </View>
          </View>
        </>
      )}
      {currentPage === "send" && (
        <SendTransaction
          balance={balance}
          defaultNonce={defaultNonce}
          setCurrentPage={setCurrentPage}
          setFetchDefaultDataToggle={setFetchDefaultDataToggle}
        />
      )}
    </View>
  );
};
export default Account;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EDEDED",
    paddingHorizontal: 16,
    paddingVertical: 24
  },
  accountInfoBox: {
    alignItems: "center",
  },
  accountText: {
    fontSize: 28,
  },
  addressBox: {
    flexDirection: "row",
    paddingBottom: 20,
    paddingTop: 12,
  },
  address: {
    color: "dimgray",
    fontSize: 16,
    marginRight: 4,
  },
  subContainer: {
    borderTopWidth: 1,
    borderTopColor: "gray",
    paddingTop: 24,
  },
  tokenIcon: {
    alignItems: "center",
    paddingBottom: 12,
  },
  balanceText: {
    textAlign: "center",
    fontSize: 28,
    fontWeight: "500",
  },
  iconGroup: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingTop: 36,
  },
  icon: {
    backgroundColor: "#007AFF",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 52,
    height: 48,
    width: 48,
  },
  iconText: {
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "500",
    fontSize: 16,
    paddingTop: 8,
  },
});
