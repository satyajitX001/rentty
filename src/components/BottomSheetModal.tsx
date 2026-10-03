import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { BottomSheetModal, BottomSheetModalProps } from "@gorhom/bottom-sheet";
import { View, StyleSheet } from "react-native";
import { AppTheme, useAppTheme, useThemedStyles } from "../theme";

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  children: React.ReactNode;
  snapPoints?: (number | string)[];
  style?: any;
  enablePanDownToClose?: boolean;
  keyboardBehavior?: "extend" | "fill" | "interactive";
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

export const BottomSheetModalWrapper = forwardRef<any, Props>(
  ({ visible, onRequestClose, children, snapPoints = ["95%", "50%", "25%"], style, enablePanDownToClose = true, keyboardBehavior = "extend" }, ref) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    useImperativeHandle(ref, () => ({
      snapToIndex: (index: number) => bottomSheetRef.current?.snapToIndex(index),
      close: () => bottomSheetRef.current?.close(),
      expand: () => bottomSheetRef.current?.expand(),
      collapse: () => bottomSheetRef.current?.collapse(),
    }));

    React.useEffect(() => {
      if (visible) {
        bottomSheetRef.current?.snapToIndex(0);
      } else {
        bottomSheetRef.current?.close();
      }
    }, [visible]);

    React.useEffect(() => {
      if (visible && bottomSheetRef.current) {
        const dismissSubscription = bottomSheetRef.current.addOnDismissListener(() => {
          onRequestClose();
        });
        return () => dismissSubscription.remove();
      }
    }, [visible, onRequestClose]);

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={visible ? 0 : -1}
        onChange={onRequestClose}
        enablePanDownToClose={enablePanDownToClose}
        backdropComponent={Backdrop}
        keyboardBehavior={keyboardBehavior}
        style={styles.container}
      >
        <View style={[styles.content, style]}>{children}</View>
      </BottomSheetModal>
    );
  }
);

BottomSheetModalWrapper.displayName = "BottomSheetModalWrapper";

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});