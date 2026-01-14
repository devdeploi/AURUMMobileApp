/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../styles/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';

const BottomNav = ({ activeTab, onTabChange, tabs }) => {
    return (
        <View style={styles.container}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.id}
                    style={styles.tab}
                    onPress={() => onTabChange(tab.id)}
                >
                    <Icon
                        name={tab.icon}
                        size={20}
                        color={activeTab === tab.id ? COLORS.primary : COLORS.secondary}
                        style={{ marginBottom: 4 }}
                    />
                    <Text style={[styles.label, activeTab === tab.id && styles.activeLabel]}>
                        {tab.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingBottom: 20, // Safe area padding
        paddingTop: 10,
        justifyContent: 'space-around',
    },
    tab: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 15
    },
    label: {
        fontSize: 10,
        color: COLORS.secondary,
    },
    activeLabel: {
        color: COLORS.primary,
        fontWeight: 'bold',
    },
});

export default BottomNav;
