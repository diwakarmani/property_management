import { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, PanResponder, Text } from 'react-native';

interface DualRangeSliderProps {
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  onValueChange?: (values: [number, number]) => void;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  thumbSize?: number;
  style?: any;
}

const DualRangeSlider = ({
  minimumValue = 0,
  maximumValue = 1000000,
  step = 1000,
  onValueChange,
  minimumTrackTintColor = '#FF6B6B',
  maximumTrackTintColor = '#E0E0E0',
  thumbTintColor = '#FF6B6B',
  thumbSize = 20,
  style,
}: DualRangeSliderProps) => {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    minimumValue + (maximumValue - minimumValue) * 0.2,
    minimumValue + (maximumValue - minimumValue) * 0.8,
  ]);
  const sliderWidth = useRef(0);
  const stateRef = useRef(priceRange);
  const startPosRef = useRef({ minPixel: 0, maxPixel: 0 });

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = priceRange;
  }, [priceRange]);

  // Convert price to pixel position
  const getPriceToPixel = (price: number): number => {
    if (sliderWidth.current === 0) return 0;
    return ((price - minimumValue) / (maximumValue - minimumValue)) * sliderWidth.current;
  };

  // Convert pixel position to price
  const getPixelToPrice = (pixel: number): number => {
    if (sliderWidth.current === 0) return minimumValue;
    let price = (pixel / sliderWidth.current) * (maximumValue - minimumValue) + minimumValue;
    return Math.round(price / step) * step;
  };

  // Pan responder for min thumb
  const minPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Store the starting position when touch begins
        startPosRef.current.minPixel = getPriceToPixel(stateRef.current[0]);
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentMax = stateRef.current[1];
        
        // Calculate new position based on starting position + total delta
        const newPixel = startPosRef.current.minPixel + gestureState.dx;
        const constrainedPixel = Math.max(0, Math.min(newPixel, sliderWidth.current));
        const newPrice = getPixelToPrice(constrainedPixel);

        if (newPrice < currentMax && newPrice >= minimumValue) {
          setPriceRange([newPrice, currentMax]);
        }
      },
      onPanResponderRelease: () => {
        const snappedMin = Math.round(stateRef.current[0] / step) * step;
        const currentMax = stateRef.current[1];
        setPriceRange([snappedMin, currentMax]);
        onValueChange?.([snappedMin, currentMax]);
      },
    })
  ).current;

  // Pan responder for max thumb
  const maxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        // Store the starting position when touch begins
        startPosRef.current.maxPixel = getPriceToPixel(stateRef.current[1]);
      },
      onPanResponderMove: (evt, gestureState) => {
        const currentMin = stateRef.current[0];
        
        // Calculate new position based on starting position + total delta
        const newPixel = startPosRef.current.maxPixel + gestureState.dx;
        const constrainedPixel = Math.max(0, Math.min(newPixel, sliderWidth.current));
        const newPrice = getPixelToPrice(constrainedPixel);

        if (newPrice > currentMin && newPrice <= maximumValue) {
          setPriceRange([currentMin, newPrice]);
        }
      },
      onPanResponderRelease: () => {
        const currentMin = stateRef.current[0];
        const snappedMax = Math.round(stateRef.current[1] / step) * step;
        setPriceRange([currentMin, snappedMax]);
        onValueChange?.([currentMin, snappedMax]);
      },
    })
  ).current;

  const minPos = getPriceToPixel(priceRange[0]);
  const maxPos = getPriceToPixel(priceRange[1]);

  return (
    <>
     {/* Price Display */}
          <View style={styles.priceInputRow}>
            <View style={styles.priceInput}>
              <Text style={styles.label}>Minimum</Text>
              <Text style={styles.price}>₹ {priceRange[0].toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.priceInput}>
              <Text style={styles.label}>Maximum</Text>
              <Text style={styles.price}>₹ {priceRange[1].toLocaleString('en-IN')}</Text>
            </View>
          </View>
    <View style={[styles.container, style]}>
      <View
        style={styles.sliderWrapper}
        onLayout={(event) => {
          sliderWidth.current = event.nativeEvent.layout.width;
        }}
      >
        {/* Background Track */}
        <View style={[styles.sliderTrack, { backgroundColor: maximumTrackTintColor }]} />

        {/* Active Range Highlight */}
        <View
          style={[
            styles.activeRange,
            {
              left: minPos,
              width: Math.max(0, maxPos - minPos),
              backgroundColor: minimumTrackTintColor,
            },
          ]}
        />

        {/* Min Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: minPos - thumbSize / 2,
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              zIndex: priceRange[0] > (minimumValue + maximumValue) / 2 ? 5 : 3,
            },
          ]}
          {...minPanResponder.panHandlers}
        >
          <View
            style={[
              styles.thumbInner,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                backgroundColor: thumbTintColor,
              },
            ]}
          />
        </View>

        {/* Max Thumb */}
        <View
          style={[
            styles.thumb,
            {
              left: maxPos - thumbSize / 2,
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbSize / 2,
              zIndex: priceRange[1] > (minimumValue + maximumValue) / 2 ? 3 : 5,
            },
          ]}
          {...maxPanResponder.panHandlers}
        >
          <View
            style={[
              styles.thumbInner,
              {
                width: thumbSize,
                height: thumbSize,
                borderRadius: thumbSize / 2,
                backgroundColor: thumbTintColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  sliderWrapper: {
    height: 40,
    justifyContent: 'center',
    position: 'relative',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    width: '100%',
    top: 18,
  },
  activeRange: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    top: 18,
  },
  thumb: {
    position: 'absolute',
    top: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbInner: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
   priceInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  priceInput: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  trackBackground: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    position: 'absolute',
    width: '100%',
    top: 28,
    zIndex: 1,
  },
});

export default DualRangeSlider;