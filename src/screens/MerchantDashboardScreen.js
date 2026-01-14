
/* eslint-disable no-unused-vars */
/* eslint-disable react-native/no-inline-styles */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
    Modal,
    ActivityIndicator,
    Alert,
    TextInput,
    ScrollView,
    Image
} from 'react-native';
import { COLORS, FONTS } from '../styles/theme';
import BottomNav from '../components/BottomNav';
import axios from 'axios';
import { APIURL } from '../constants/api';
import Icon from 'react-native-vector-icons/FontAwesome5';

import RazorpayCheckout from 'react-native-razorpay';
import { launchImageLibrary } from 'react-native-image-picker';

import GoldTicker from '../components/GoldTicker';
import MerchantOverview from '../components/MerchantOverview';
import MerchantPlans from '../components/MerchantPlans';
import MerchantUsers from '../components/MerchantUsers';
import MerchantProfile from '../components/MerchantProfile';

const MerchantDashboardScreen = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const merchantTabs = [
        { id: 'overview', icon: 'chart-pie', label: 'Overview' },
        { id: 'plans', icon: 'clipboard-list', label: 'My Plans' },
        { id: 'subscribers', icon: 'users', label: 'Users' },
        { id: 'profile', icon: 'user-cog', label: 'Profile' },
    ];

    const [stats, setStats] = useState({ activePlans: 0, totalEnrolled: 0 });
    const [plans, setPlans] = useState([]);
    const [subscribers, setSubscribers] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(false);

    // Profile Edit State
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileData, setProfileData] = useState({ ...user });
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // New Action States
    const [verifyingBank, setVerifyingBank] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState(false);

    const fetchPlans = useCallback(async () => {
        if (!user) return;
        try {
            setLoadingPlans(true);
            const id = user._id || user.id;
            const token = user.token;

            const { data } = await axios.get(`${APIURL}/chit-plans/merchant/${id}?limit=100`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const fetchedPlans = data.plans || [];
            setPlans(fetchedPlans);

            const activePlans = fetchedPlans.length;
            const totalEnrolled = fetchedPlans.reduce((acc, plan) => acc + (plan.subscribers ? plan.subscribers.length : 0), 0);

            setStats({ activePlans, totalEnrolled });

            // Derive subscribers from plans
            let allSubscribers = [];
            fetchedPlans.forEach(plan => {
                if (plan.subscribers) {
                    plan.subscribers.forEach(sub => {
                        allSubscribers.push({
                            ...sub,
                            planName: plan.planName,
                            planAmount: plan.monthlyAmount,
                            _id: sub._id || sub.id || Math.random().toString()
                        });
                    });
                }
            });
            setSubscribers(allSubscribers);

        } catch (error) {
            console.error("Error fetching merchant data", error);
        } finally {
            setLoadingPlans(false);
        }
    }, [user]);

    // Fetch Stats & Plans
    useEffect(() => {
        if (activeTab === 'overview' || activeTab === 'plans' || activeTab === 'subscribers') {
            fetchPlans();
        }

        const fetchProfile = async () => {
            if (!user) return;
            try {
                const token = user.token;
                const id = user._id || user.id;
                const { data } = await axios.get(`${APIURL}/merchants/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("Full DB Profile:", data);
                // Ensure nested objects exist
                const safeData = {
                    ...data,
                    bankDetails: data.bankDetails || { accountNumber: '', ifscCode: '', accountHolderName: '' },
                    shopImages: data.shopImages || []
                };
                setProfileData(prev => ({ ...prev, ...safeData }));
            } catch (error) {
                console.error("Error fetching profile", error);
            }
        };

        if (user) {
            fetchProfile();
        }
    }, [user, activeTab, fetchPlans]);

    const handleUpdateProfile = async () => {
        setUpdatingProfile(true);
        try {
            const token = user.token;
            const id = user._id || user.id;
            await axios.put(`${APIURL}/merchants/${id}`, profileData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            Alert.alert('Success', 'Profile updated successfully');
            setIsEditingProfile(false);
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setUpdatingProfile(false);
        }
    };

    // --- NEW HELPER FUNCTIONS ---

    const verifyBankAccount = async () => {
        const { accountNumber, ifscCode, accountHolderName } = profileData.bankDetails || {};
        if (!accountNumber || !ifscCode) {
            Alert.alert("Missing Info", "Please enter Account Number and IFSC code.");
            return;
        }

        setVerifyingBank(true);
        try {
            const { data } = await axios.post(`${APIURL}/kyc/verify-bank`, { accountNumber, ifscCode, accountHolderName });
            if (data.status === 'success') {
                const updatedBankDetails = {
                    ...profileData.bankDetails,
                    verifiedName: data.data.verifiedName,
                    bankName: data.data.bankName,
                    branchName: data.data.branchName,
                    verificationStatus: 'verified'
                };
                setProfileData(prev => ({ ...prev, bankDetails: updatedBankDetails }));
                Alert.alert("Success", `Bank Verified: ${data.data.verifiedName}`);
            } else {
                Alert.alert("Failed", "Bank Verification Failed");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", error.response?.data?.message || "Bank Verification Failed");
        } finally {
            setVerifyingBank(false);
        }
    };

    const handleImageUpload = async (type) => { // type: 'addressProof' or 'shopImage'
        const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });

        if (result.didCancel || !result.assets || result.assets.length === 0) return;

        const asset = result.assets[0];
        const formData = new FormData();
        formData.append('image', {
            uri: asset.uri,
            type: asset.type,
            name: asset.fileName || 'upload.jpg',
        });

        setUploadingDoc(true);
        try {
            const token = user.token;
            const { data: imagePath } = await axios.post(`${APIURL}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });

            if (type === 'addressProof') {
                setProfileData(prev => ({ ...prev, addressProof: imagePath }));
            } else if (type === 'shopImage') {
                setProfileData(prev => ({
                    ...prev,
                    shopImages: [...(prev.shopImages || []), imagePath]
                }));
            }
            Alert.alert("Success", "Variable uploaded successfully");

        } catch (error) {
            console.error("Upload failed", error);
            Alert.alert("Error", "Image upload failed");
        } finally {
            setUploadingDoc(false);
        }
    };

    const removeShopImage = (index) => {
        const newImages = [...(profileData.shopImages || [])];
        newImages.splice(index, 1);
        setProfileData(prev => ({ ...prev, shopImages: newImages }));
    };

    const handleUpgradePayment = async () => {
        if (profileData.plan === 'Premium') {
            Alert.alert("Info", "You are already a Premium member!");
            return;
        }

        try {
            // 1. Create Order
            const { data: order } = await axios.post(`${APIURL}/payments/create-subscription-order`, {
                amount: 5000 // Rs 5000
            });

            // 2. Open Razorpay
            const options = {
                description: 'Upgrade to Platinum Plan',
                image: 'https://i.imgur.com/3g7nmJC.png', // Optional
                currency: order.currency,
                key: 'rzp_test_S0aFMLxRqwkL8z', // Use config or env in real app
                amount: order.amount,
                name: 'Aurum Jewellery',
                order_id: order.id,
                prefill: {
                    email: profileData.email,
                    contact: profileData.phone,
                    name: profileData.name
                },
                theme: { color: COLORS.primary }
            };

            RazorpayCheckout.open(options).then(async (data) => {
                // handle success
                try {
                    const verifyRes = await axios.post(`${APIURL}/payments/verify-subscription-payment`, {
                        razorpay_order_id: data.razorpay_order_id,
                        razorpay_payment_id: data.razorpay_payment_id,
                        razorpay_signature: data.razorpay_signature
                    });

                    if (verifyRes.data.status === 'success') {
                        const token = user.token;
                        const id = user._id || user.id;
                        // Update Plan on Backend
                        const updatePayload = { ...profileData, plan: 'Premium', paymentId: data.razorpay_payment_id };
                        const { data: updatedMerchant } = await axios.put(`${APIURL}/merchants/${id}`, updatePayload, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        setProfileData(prev => ({ ...prev, ...updatedMerchant }));
                        Alert.alert("Success", "Welcome to Premium Plan!");
                    }
                } catch (err) {
                    Alert.alert("Error", "Payment Verification Failed");
                }
            }).catch((error) => {
                // handle failure
                console.log(error);
                Alert.alert("Error", `Payment Failed: ${error.description || 'Unknown error'}`);
            });

        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to initiate payment");
        }
    };


    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <MerchantOverview user={user} stats={stats} />;
            case 'plans':
                return (
                    <MerchantPlans
                        user={{ ...user, ...profileData }}
                        loadingPlans={loadingPlans}
                        plans={plans}
                        onPlanCreated={fetchPlans}
                    />
                );
            case 'subscribers':
                return <MerchantUsers subscribers={subscribers} />;
            case 'profile':
                return (
                    <MerchantProfile
                        user={user}
                        profileData={profileData}
                        setProfileData={setProfileData}
                        isEditingProfile={isEditingProfile}
                        setIsEditingProfile={setIsEditingProfile}
                        handleUpdateProfile={handleUpdateProfile}
                        updatingProfile={updatingProfile}
                        verifyBankAccount={verifyBankAccount}
                        verifyingBank={verifyingBank}
                        handleImageUpload={handleImageUpload}
                        uploadingDoc={uploadingDoc}
                        removeShopImage={removeShopImage}
                        handleUpgradePayment={handleUpgradePayment}
                        setShowLogoutModal={setShowLogoutModal}
                        onLogout={onLogout}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Image source={{ uri: 'aurum_logo' }} style={{ width: 30, height: 30, marginRight: 10, resizeMode: 'contain' }} />
                    <Text style={styles.appTitle}>Merchant Portal</Text>
                </View>
                <TouchableOpacity onPress={() => setShowLogoutModal(true)}>
                    <Icon name="sign-out-alt" size={20} color={COLORS.danger} />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.mainContent}>
                {renderContent()}
            </View>

            {/* Bottom Nav */}
            <BottomNav activeTab={activeTab} onTabChange={setActiveTab} tabs={merchantTabs} />

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
        backgroundColor: '#fff',
        marginTop: 35,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        backgroundColor: '#fff',
    },
    appTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 1,
    },
    mainContent: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    logoutText: {
        color: '#dc2626',
        fontWeight: 'bold',
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

export default MerchantDashboardScreen;
