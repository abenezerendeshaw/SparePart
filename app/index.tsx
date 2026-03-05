import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import storage from './lib/storage';

const { width, height } = Dimensions.get('window');

// Onboarding data
const onboardingData = [
  {
    id: '1',
    title: 'እንኳን ወደ አውቶፓርትስ ፕሮ በደህና መጡ',
    subtitle: 'Welcome to AutoParts Pro',
    description: 'የእቃ ክምችትዎን በቀላሉ ያስተዳድሩ',
    icon: 'car-wrench',
    colors: ['#2974ff', '#1a4c9e'],
    image: '🚗',
  },
  {
    id: '2',
    title: 'ክምችት ያስተዳድሩ',
    subtitle: 'Manage Inventory',
    description: 'ምርቶችዎን በቀላሉ ይቆጣጠሩ እና ይከታተሉ',
    icon: 'package-variant',
    colors: ['#10b981', '#059669'],
    image: '📦',
  },
  {
    id: '3',
    title: 'ሽያጭ ይመዝግቡ',
    subtitle: 'Track Sales',
    description: 'ሽያጮችዎን ይመዝግቡ እና ገቢዎን ይከታተሉ',
    icon: 'cash-register',
    colors: ['#f59e0b', '#d97706'],
    image: '💰',
  },
  {
    id: '4',
    title: 'ሪፖርት ያግኙ',
    subtitle: 'Get Reports',
    description: 'የንግድዎን እድገት በዝርዝር ይመልከቱ',
    icon: 'chart-bar',
    colors: ['#8b5cf6', '#6d28d9'],
    image: '📊',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLastSlide, setIsLastSlide] = useState(false);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  // Check if user has already seen onboarding
  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const hasSeenOnboarding = await storage.getItem('hasSeenOnboarding');
      if (hasSeenOnboarding === 'true') {
        // Check if user is already logged in
        const token = await storage.getItem('authToken');
        if (token) {
          // Go to tab dashboard
          router.replace('/(tab)');
        } else {
          // Go to login
          router.replace('/auth/login');
        }
      }
    } catch (error) {
      console.log('Error checking onboarding status:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = async () => {
    try {
      // Mark onboarding as seen
      await storage.setItem('hasSeenOnboarding', 'true');
      
      // Navigate to login
      router.replace('/auth/login');
    } catch (error) {
      console.log('Error saving onboarding status:', error);
      router.replace('/auth/login');
    }
  };

  const renderItem = ({ item, index }: { item: typeof onboardingData[0]; index: number }) => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    
    const imageScale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1.2, 0.8],
      extrapolate: 'clamp',
    });

    const textTranslateY = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, 50],
      extrapolate: 'clamp',
    });

    return (
      <LinearGradient
        colors={['#0f1623', '#1a2634']}
        style={styles.slide}
      >
        {/* Decorative Elements */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        
        <View style={styles.slideContent}>
          {/* Image/Icon Container */}
          <Animated.View 
            style={[
              styles.imageContainer,
              { transform: [{ scale: imageScale }] }
            ]}
          >
            <LinearGradient
              colors={item.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.imageGradient}
            >
              <Text style={styles.emojiImage}>{item.image}</Text>
            </LinearGradient>
          </Animated.View>

          {/* Text Content */}
          <Animated.View 
            style={[
              styles.textContainer,
              { transform: [{ translateY: textTranslateY }] }
            ]}
          >
            <Text style={styles.subtitle}>{item.subtitle}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    );
  };

  const Pagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {onboardingData.map((_, index) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 30, 10],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          const backgroundColor = scrollX.interpolate({
            inputRange,
            outputRange: ['#64748b', '#2974ff', '#64748b'],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
      
      {/* Skip Button */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>ዝለል</Text>
        </TouchableOpacity>
      )}

      {/* Onboarding Slides */}
      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
          setIsLastSlide(index === onboardingData.length - 1);
        }}
      />

      {/* Pagination Dots */}
      <Pagination />

      {/* Next/Get Started Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isLastSlide ? ['#10b981', '#059669'] : ['#2974ff', '#1a4c9e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {isLastSlide ? '🚀 ጀምር' : 'ቀጥል'}
            </Text>
            <MaterialCommunityIcons
              name={isLastSlide ? 'check-circle' : 'arrow-right'}
              size={20}
              color="#ffffff"
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Login Link for existing users */}
      <TouchableOpacity
        style={styles.loginLink}
        onPress={() => router.push('/auth/login')}
      >
        <Text style={styles.loginText}>
          ቀድሞውንም መለያ አለዎት? <Text style={styles.loginBold}>ግባ</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1623',
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(41, 116, 255, 0.1)',
    transform: [{ scale: 1.5 }],
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(41, 116, 255, 0.1)',
    transform: [{ scale: 1.5 }],
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  imageContainer: {
    marginBottom: 40,
    shadowColor: '#2974ff',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  imageGradient: {
    width: 180,
    height: 180,
    borderRadius: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  emojiImage: {
    fontSize: 80,
  },
  textContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 8,
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 36,
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  skipButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '600',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 180,
    width: '100%',
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 100,
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#2974ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  loginText: {
    color: '#64748b',
    fontSize: 14,
  },
  loginBold: {
    color: '#2974ff',
    fontWeight: 'bold',
  },
});