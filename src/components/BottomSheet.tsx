import React, { ReactNode } from "react";
import { BottomSheetModal, BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { View, StyleSheet } from "react-native";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";

type Props = {
  children: ReactNode;
};

export const BottomSheetProvider: React.FC<Props> = ({ children }) => {
  return <BottomSheetModalProvider>{children}</BottomSheetModalProvider>;
};

type BottomSheetContentProps = {
  snapPoints?: number[];
  index?: number;
  onChangeIndex?: (index: number) => void;
  children: ReactNode;
  style?: any;
};

export const BottomSheetContent = ({
  snapPoints = ["95%", "50%", "25%"],
  index = 0,
  onChangeIndex,
  children,
  style,
}: BottomSheetContentProps) => {
  return (
    <BottomSheetModal
      ref={React.useRef<BottomSheetModal>(null)}
      snapPoints={snapPoints}
      index={index}
      onChange={onChangeIndex}
      enablePanDownToClose={true}
      backdropComponent={Backdrop}
      keyboardBehavior="extend"
    >
      <View style={[styles.container, style]}>{children}</View>
    </BottomSheetModal>
  );
};

const Backdrop = ({ style, animatedPosition, ...props }: any) => {
  const { colors } = useAppTheme();
  return (
    <View
      {...props}
      style={[
        styles.backdrop,
        {
          backgroundColor: "rgba(9, 18, 39, 0.45)",
          opacity: animatedPosition.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1],
          }),
        },
        style,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  backdrop: {
    flex: 1,
  },
});

// Hook for easier usage
export const useBottomSheet = () => {
  const ref = React.useRef<BottomSheetModal>(null);
  const snapPoints = React.useMemo(() => ["95%", "50%", "25%"], []);

  const open = (index = 0) => {
    ref.current?.snapToIndex(index);
  };

  const close = () => {
    ref.current?.close();
  };

  return { ref, snapPoints, open, close };
};