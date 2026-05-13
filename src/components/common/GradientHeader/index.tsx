import { colors } from '@/theme'
import { FontAwesome } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import React from 'react'
import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native'
const STATUSBAR_HEIGHT = StatusBar.currentHeight ?? 44;

type GradientHeaderProps = {
    title: string;
    subtitle: string;
}
const GradientHeader = ({ title, subtitle }: GradientHeaderProps) => {
    return (
        <LinearGradient
            colors={[colors.secondary, colors.primary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
        >
            <View style={styles.iconContainer}>
                <View style={styles.iconWrapper}>
                    {/* House Icon (SVG-like using Views) */}
                    <FontAwesome name="home" size={32} color={colors.primary} />
                </View>
            </View>

            <Text style={styles.welcomeTitle}>{title}</Text>
            <Text style={styles.welcomeSubtitle}>{subtitle}</Text>
        </LinearGradient>
    )
}
const styles = StyleSheet.create({
    headerGradient: {
        paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT + 20 : 60,
        paddingBottom: 60,
        alignItems: 'center',
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    iconContainer: {
        marginBottom: 20,
        marginTop: 10
    },
    iconWrapper: {
        width: 100,
        height: 80,
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },


    welcomeTitle: {
        fontSize: 32,
        fontWeight: '600',
        color: '#FFFFFF',
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.80)',
        fontWeight: '300',
        letterSpacing: 0.2,
    },
})
export default GradientHeader