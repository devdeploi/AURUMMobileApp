/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Alert,
    Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import axios from 'axios';
import { COLORS } from '../styles/theme';
import BottomNav from '../components/BottomNav';
import { APIURL } from '../constants/api';
import { launchImageLibrary } from 'react-native-image-picker';
import GoldTicker from '../components/GoldTicker';

import DashboardTab from '../components/dashboard/DashboardTab';
import MerchantsTab from '../components/dashboard/MerchantsTab';
import AnalyticsTab from '../components/dashboard/AnalyticsTab';
import ProfileTab from '../components/dashboard/ProfileTab';

const UserDashboardScreen = ({ user: initialUser, onLogout, onSelectMerchant, initialTab = 'dashboard' }) => {
    const [user, setUser] = useState(initialUser);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Merchants State
    const [merchants, setMerchants] = useState([]);
    const [page, setPage] = useState(1);
    const [loadingMerchants, setLoadingMerchants] = useState(false);
    const [hasMoreMerchants, setHasMoreMerchants] = useState(true);

    const handleLogoutPress = () => {
        setShowLogoutModal(true);
    };

    useEffect(() => {
        if (activeTab === 'merchants') {
            fetchMerchants();
        }
    }, [activeTab]);

    const fetchMerchants = async () => {
        if (loadingMerchants || (merchants.length > 0 && page === 1)) return;

        if (merchants.length > 0 && page === 1 && activeTab === 'merchants') {
            return;
        }

        setLoadingMerchants(true);
        try {
            const { data } = await axios.get(`${APIURL}/merchants?page=${page}&limit=10`);

            if (page === 1) {
                setMerchants(data.merchants);
            } else {
                setMerchants(prev => [...prev, ...data.merchants]);
            }

            setHasMoreMerchants(data.pagination.hasNextPage);

        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to load merchants');
        } finally {
            setLoadingMerchants(false);
        }
    };

    const handleLoadMoreMerchants = () => {
        if (hasMoreMerchants && !loadingMerchants) {
            setPage(prev => prev + 1);
        }
    };

    useEffect(() => {
        if (activeTab === 'merchants') {
            if (page > 1) {
                const loadMore = async () => {
                    setLoadingMerchants(true);
                    try {
                        const { data } = await axios.get(`${APIURL}/merchants?page=${page}&limit=10`);
                        setMerchants(prev => [...prev, ...data.merchants]);
                        setHasMoreMerchants(data.pagination.hasNextPage);
                    } catch (error) {
                        console.log(error);
                    } finally {
                        setLoadingMerchants(false);
                    }
                };
                loadMore();
            } else if (page === 1 && merchants.length === 0) {
                // Initial load logic moved to fetchMerchants mostly, but if we need force refresh logic here:
                const initialLoad = async () => {
                    setLoadingMerchants(true);
                    try {
                        const { data } = await axios.get(`${APIURL}/merchants?page=${1}&limit=10`);
                        setMerchants(data.merchants);
                        setHasMoreMerchants(data.pagination.hasNextPage);
                    } catch (error) {
                        console.log(error);
                    } finally {
                        setLoadingMerchants(false);
                    }
                };
                initialLoad();
            }
        }
    }, [page, activeTab]);

    const handleUpdateProfile = async (updatedData) => {
        try {
            const userId = user._id || user.id;
            const { data } = await axios.put(`${APIURL}/users/${userId}`, updatedData);
            setUser({ ...user, ...data });
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update profile');
            throw error; // Propagate error so child can handle loading state if needed
        }
    };

    const updateProfileImage = async () => {
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
        if (result.didCancel || !result.assets || result.assets.length === 0) return;

        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('image', {
            uri: asset.uri,
            type: asset.type,
            name: asset.fileName || 'profile.jpg',
        });

        try {
            const { data: imagePath } = await axios.post(`${APIURL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            await handleUpdateProfile({ profileImage: imagePath });
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to upload image');
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <DashboardTab user={user} />;
            case 'merchants':
                return (
                    <MerchantsTab
                        merchants={merchants}
                        loading={loadingMerchants}
                        onLoadMore={handleLoadMoreMerchants}
                        onSelectMerchant={onSelectMerchant}
                        hasMore={hasMoreMerchants}
                    />
                );
            case 'analytics':
                return <AnalyticsTab />;
            case 'profile':
                return <ProfileTab user={user} onUpdate={handleUpdateProfile} onUpdateImage={updateProfileImage} />;
            default:
                return null;
        }
    };

    const userTabs = [
        { id: 'dashboard', icon: 'home', label: 'Dashboard' },
        { id: 'merchants', icon: 'store', label: 'Merchants' },
        { id: 'analytics', icon: 'chart-line', label: 'Analytics' },
        { id: 'profile', icon: 'user', label: 'Profile' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>A U R U M</Text>
                    {/* <Text style={styles.headerSubtitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</Text> */}
                </View>
                <View style={{ flex: 1, marginLeft: 80, marginRight: 10 }}>
                    <GoldTicker />
                </View>
            </View>

            <View style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
                {renderContent()}
            </View>

            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} tabs={userTabs} />

            {/* Logout Modal */}
            <Modal visible={showLogoutModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Icon name="exclamation-triangle" size={40} color={COLORS.warning} style={{ marginBottom: 15 }} />
                        <Text style={styles.modalTitle}>Confirm Logout</Text>
                        <Text style={styles.modalText}>Are you sure you want to log out?</Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setShowLogoutModal(false)}>
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={onLogout}>
                                <Text style={styles.confirmButtonText}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.light,
        marginTop: 35
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.white,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.secondary,
    },
    logoutButton: {
        padding: 10,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '85%',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    modalText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    modalButtons: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        gap: 15,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#f8f9fa',
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});

export default UserDashboardScreen;

