import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { supabase } from "../../lib/supabase";

export default function TestSupabase() {
  useEffect(() => {
    const test = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(1);
      console.log("Supabase test:", { data, error });
    };
    test();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Supabase Bağlantısı Test Ediliyor...</Text>
    </View>
  );
}
