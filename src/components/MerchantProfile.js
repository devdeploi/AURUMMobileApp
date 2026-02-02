/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, StyleSheet, Dimensions, Modal, RefreshControl } from 'react-native';
import { COLORS } from '../styles/theme';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { APIURL } from '../constants/api';

const { width } = Dimensions.get('window');

const MerchantProfile = ({
    user,
    profileData,
    setProfileData,
    isEditingProfile,
    setIsEditingProfile,
    handleUpdateProfile,
    updatingProfile,
    verifyBankAccount,
    verifyingBank,
    handleImageUpload,
    uploadingDoc,
    removeShopImage,
    handleUpgradePayment,
    setShowLogoutModal,
    onLogout,
    onRefresh,
    pauseAds,
    resumeAds
}) => {
    const [showPremiumModal, setShowPremiumModal] = useState(false);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (onRefresh) {
            setRefreshing(true);
            await onRefresh();
            setRefreshing(false);
        }
    };
    console.log("User", user);
    console.log("Profile Data", profileData);


    return (
        <View style={{ flex: 1 }}>
            <ScrollView
                contentContainerStyle={[styles.contentContainer, isEditingProfile && { paddingBottom: 100 }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[COLORS.primary]} />
                }
            >
                {profileData.plan !== 'Premium' && (
                    <TouchableOpacity
                        style={styles.upgradeCard}
                        activeOpacity={0.9}
                        onPress={() => {

                            setShowPremiumModal(true);
                        }}
                    >
                        <View style={styles.upgradeContent}>
                            <View style={styles.upgradeBadge}>
                                <Icon name="crown" size={24} color={COLORS.warning} />
                            </View>
                            <View style={styles.upgradeInfo}>
                                <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                                <Text style={styles.upgradeDescription}>
                                    Tap to view plan details and benefits
                                </Text>
                            </View>
                            <Icon name="chevron-right" size={16} color={COLORS.warning} />
                        </View>
                    </TouchableOpacity>
                )}
                {/* Profile Header Card */}
                {/* Minimal Profile Header */}
                <View style={styles.profileHeaderMinimal}>
                    <View style={styles.profileRow}>
                        <TouchableOpacity
                            onPress={() => isEditingProfile && handleImageUpload('shopLogo')}
                            style={styles.avatarContainerMinimal}
                        >
                            {profileData.shopLogo ? (
                                <Image
                                    source={{ uri: `${APIURL.replace('/api', '')}${profileData.shopLogo}` }}
                                    style={styles.avatarMinimal}
                                />
                            ) : (
                                <Icon name="store" size={30} color={COLORS.primary} style={styles.avatarMinimal} />
                            )}
                            {isEditingProfile && (
                                <View style={styles.avatarEditBadge}>
                                    <Icon name="camera" size={10} color="#fff" />
                                </View>
                            )}
                        </TouchableOpacity>

                        <View style={styles.profileInfoMinimal}>
                            <Text style={styles.profileNameMinimal}>{profileData.name || user.name}</Text>
                            <View style={styles.planBadgeMinimal}>
                                <Icon name="crown" size={10} color="#F59E0B" />
                                <Text style={styles.planTextMinimal}>{profileData.plan || 'Standard'}</Text>
                            </View>
                            {profileData.subscriptionExpiryDate && (
                                <Text style={{ fontSize: 11, color: COLORS.secondary, marginTop: 4 }}>
                                    Renew: {new Date(profileData.subscriptionExpiryDate).toLocaleDateString()}
                                </Text>
                            )}
                        </View>

                        <TouchableOpacity
                            style={styles.editBtnMinimal}
                            onPress={() => setIsEditingProfile(!isEditingProfile)}
                        >
                            <Text style={styles.editBtnTextMinimal}>{isEditingProfile ? 'Cancel' : 'Edit'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Business Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <Icon name="building" size={18} color={COLORS.primary} />
                            <Text style={styles.cardTitle}>Business Information</Text>
                        </View>
                        <View style={styles.cardStatus}>
                            <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                            <Text style={styles.statusText}>Active</Text>
                        </View>
                    </View>

                    {isEditingProfile ? (
                        <View style={styles.editForm}>
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Business Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profileData.name}
                                    onChangeText={(text) => setProfileData({ ...profileData, name: text })}
                                    placeholder="Enter business name"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Email</Text>
                                <TextInput
                                    style={[styles.input, styles.readOnlyInput]}
                                    value={profileData.email}
                                    editable={false}
                                    placeholder="Email Address"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Phone</Text>
                                <TextInput
                                    style={[styles.input, styles.readOnlyInput]}
                                    value={profileData.phone}
                                    editable={false}
                                    placeholder="Phone number"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>GSTIN</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profileData.gstin}
                                    onChangeText={(text) => setProfileData({ ...profileData, gstin: text.toUpperCase() })}
                                    placeholder="GSTIN Number"
                                    autoCapitalize="characters"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Legal Name (as per PAN)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profileData.legalName}
                                    onChangeText={(text) => setProfileData({ ...profileData, legalName: text })}
                                    placeholder="Full legal name"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>PAN Number</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profileData.panNumber}
                                    onChangeText={(text) => setProfileData({ ...profileData, panNumber: text.toUpperCase() })}
                                    placeholder="PAN Number"
                                    autoCapitalize="characters"
                                />
                            </View>

                            {isEditingProfile && profileData.shopLogo && (
                                <TouchableOpacity
                                    style={styles.removeLogoBtn}
                                    onPress={() => setProfileData({ ...profileData, shopLogo: '' })}
                                >
                                    <Icon name="trash-alt" size={12} color="#ef4444" />
                                    <Text style={styles.removeLogoText}>Remove Shop Logo</Text>
                                </TouchableOpacity>
                            )}

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Business Address</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    multiline
                                    numberOfLines={3}
                                    value={profileData.address}
                                    onChangeText={(text) => setProfileData({ ...profileData, address: text })}
                                    placeholder="Enter complete business address"
                                />
                            </View>

                        </View>


                    ) : (
                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Icon name="envelope" size={14} color={COLORS.secondary} style={styles.detailIcon} />
                                <View>
                                    <Text style={styles.detailLabel}>Email</Text>
                                    <Text style={styles.detailValue}>{profileData.email}</Text>
                                </View>
                            </View>

                            <View style={styles.detailItem}>
                                <Icon name="phone" size={14} color={COLORS.secondary} style={styles.detailIcon} />
                                <View>
                                    <Text style={styles.detailLabel}>Phone</Text>
                                    <Text style={styles.detailValue}>{profileData.phone || 'Not provided'}</Text>
                                </View>
                            </View>

                            <View style={styles.detailItem}>
                                <Icon name="map-marker-alt" size={14} color={COLORS.secondary} style={styles.detailIcon} />
                                <View>
                                    <Text style={styles.detailLabel}>Address</Text>
                                    <Text style={styles.detailValue}>{profileData.address || 'Not provided'}</Text>
                                </View>
                            </View>

                            <View style={styles.detailItem}>
                                <Icon name="file-invoice-dollar" size={14} color={COLORS.secondary} style={styles.detailIcon} />
                                <View>
                                    <Text style={styles.detailLabel}>GSTIN</Text>
                                    <Text style={styles.detailValue}>{profileData.gstin || 'Not registered'}</Text>
                                </View>
                            </View>

                            <View style={styles.detailItem}>
                                <Icon name="id-card" size={14} color={COLORS.secondary} style={styles.detailIcon} />
                                <View>
                                    <Text style={styles.detailLabel}>Legal Name</Text>
                                    <Text style={styles.detailValue}>{profileData.legalName || 'Not provided'}</Text>
                                </View>
                            </View>

                            <View style={styles.detailItem}>
                                <Icon name="id-badge" size={14} color={COLORS.secondary} style={styles.detailIcon} />
                                <View>
                                    <Text style={styles.detailLabel}>PAN Number</Text>
                                    <Text style={styles.detailValue}>{profileData.panNumber || 'Not provided'}</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>

                {/* Bank Details Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <Icon name="university" size={18} color={COLORS.primary} />
                            <Text style={styles.cardTitle}>Bank Details</Text>
                        </View>
                    </View>

                    <View style={styles.bankForm}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Account Holder</Text>
                            <TextInput
                                style={[styles.input, !isEditingProfile && styles.readOnlyInput]}
                                value={profileData.bankDetails?.accountHolderName}
                                editable={isEditingProfile}
                                onChangeText={(text) => setProfileData({
                                    ...profileData,
                                    bankDetails: { ...profileData.bankDetails, accountHolderName: text }
                                })}
                                placeholder="Account holder name"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Account Number</Text>
                            <TextInput
                                style={[styles.input, !isEditingProfile && styles.readOnlyInput]}
                                value={profileData.bankDetails?.accountNumber}
                                editable={isEditingProfile}
                                onChangeText={(text) => setProfileData({
                                    ...profileData,
                                    bankDetails: { ...profileData.bankDetails, accountNumber: text }
                                })}
                                keyboardType="numeric"
                                placeholder="Account number"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>IFSC Code</Text>
                            <TextInput
                                style={[styles.input, !isEditingProfile && styles.readOnlyInput]}
                                value={profileData.bankDetails?.ifscCode}
                                editable={isEditingProfile}
                                onChangeText={(text) => setProfileData({
                                    ...profileData,
                                    bankDetails: { ...profileData.bankDetails, ifscCode: text.toUpperCase() }
                                })}
                                autoCapitalize="characters"
                                placeholder="IFSC code"
                            />
                        </View>

                    </View>
                </View>

                {/* Documents Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                            <Icon name="file-alt" size={18} color={COLORS.primary} />
                            <Text style={styles.cardTitle}>Documents</Text>
                        </View>
                    </View>

                    <View style={styles.documentsSection}>
                        {/* Address Proof */}
                        <View style={styles.documentItem}>
                            <View style={styles.documentHeader}>
                                <Icon name="home" size={16} color={COLORS.secondary} />
                                <Text style={styles.documentTitle}>Address Proof</Text>
                            </View>

                            {profileData.addressProof ? (
                                <View style={styles.documentPreview}>
                                    <Image
                                        source={{ uri: `${APIURL.replace('/api', '')}${profileData.addressProof}` }}
                                        style={styles.documentImage}
                                    />
                                    <View style={styles.documentInfo}>
                                        <Text style={styles.documentName}>Address Proof</Text>
                                        <Text style={styles.documentStatus}>Uploaded</Text>
                                    </View>
                                    {isEditingProfile && (
                                        <TouchableOpacity
                                            style={styles.documentAction}
                                            onPress={() => handleImageUpload('addressProof')}
                                        >
                                            <Icon name="sync-alt" size={16} color={COLORS.primary} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                isEditingProfile ? (
                                    <TouchableOpacity
                                        style={styles.uploadDocumentButton}
                                        onPress={() => handleImageUpload('addressProof')}
                                        disabled={uploadingDoc}
                                    >
                                        <Icon name="cloud-upload-alt" size={20} color={COLORS.primary} />
                                        <Text style={styles.uploadDocumentText}>Upload Address Proof</Text>
                                    </TouchableOpacity>
                                ) : (
                                    <View style={styles.emptyDocument}>
                                        <Icon name="exclamation-circle" size={20} color="#ccc" />
                                        <Text style={styles.emptyDocumentText}>No document uploaded</Text>
                                    </View>
                                )
                            )}
                        </View>

                        {/* Shop Images */}
                        <View style={styles.documentItem}>
                            <View style={[styles.documentHeader, { justifyContent: 'space-between' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Icon name="images" size={16} color={COLORS.secondary} />
                                    <Text style={styles.documentTitle}>Shop Images</Text>
                                    <Text style={styles.documentCount}>({profileData.shopImages?.length || 0})</Text>
                                </View>
                                {isEditingProfile && profileData.plan === 'Premium' && (
                                    <TouchableOpacity
                                        onPress={() => handleImageUpload('shopImage')}
                                        disabled={uploadingDoc}
                                        style={{
                                            backgroundColor: 'rgba(145, 82, 0, 0.1)',
                                            paddingHorizontal: 12,
                                            paddingVertical: 6,
                                            borderRadius: 20,
                                            flexDirection: 'row',
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Icon name="plus" size={10} color={COLORS.primary} style={{ marginRight: 6 }} />
                                        <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>Add</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            {profileData.plan !== 'Premium' ? (
                                <TouchableOpacity
                                    style={[styles.noImagesContainer, {
                                        backgroundColor: 'rgba(145, 82, 0, 0.03)',
                                        borderColor: 'rgba(145, 82, 0, 0.15)',
                                        borderStyle: 'dashed',
                                        borderWidth: 1.5,
                                        flexDirection: 'column',
                                    }]}
                                    onPress={() => {

                                        setShowPremiumModal(true);
                                    }}
                                >
                                    <View style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        backgroundColor: 'rgba(145, 82, 0, 0.08)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 8
                                    }}>
                                        <Icon name="crown" size={18} color={COLORS.primary} />
                                    </View>
                                    <Text style={{
                                        fontSize: 14,
                                        color: COLORS.primary,
                                        fontWeight: '700',
                                        textAlign: 'center',
                                        marginBottom: 2
                                    }}>
                                        Premium Exclusive
                                    </Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: '#888',
                                        textAlign: 'center',
                                        marginHorizontal: 20
                                    }}>
                                        Upgrade to upload shop photos
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    style={styles.shopImagesScroll}
                                >
                                    {profileData.shopImages && profileData.shopImages.length > 0 ? (
                                        <>
                                            {profileData.shopImages.map((img, idx) => (
                                                <View key={idx} style={styles.shopImageContainer}>
                                                    <Image
                                                        source={{ uri: `${APIURL.replace('/api', '')}${img}` }}
                                                        style={styles.shopImage}
                                                    />
                                                    {isEditingProfile && (
                                                        <TouchableOpacity
                                                            style={styles.removeImageButton}
                                                            onPress={() => removeShopImage(idx)}
                                                        >
                                                            <Icon name="times" size={12} color="#fff" />
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                            ))}

                                            {isEditingProfile && (
                                                <TouchableOpacity
                                                    style={styles.addImageButton}
                                                    onPress={() => handleImageUpload('shopImage')}
                                                    disabled={uploadingDoc}
                                                >
                                                    <Icon name="plus" size={24} color={COLORS.primary} />
                                                    <Text style={styles.addImageText}>Add More</Text>
                                                </TouchableOpacity>
                                            )}
                                        </>
                                    ) : (
                                        <View style={styles.noImagesContainer}>
                                            <Icon name="image" size={30} color="#ccc" />
                                            <Text style={styles.noImagesText}>No shop images</Text>
                                            {isEditingProfile && (
                                                <TouchableOpacity
                                                    style={styles.addFirstImageButton}
                                                    onPress={() => handleImageUpload('shopImage')}
                                                    disabled={uploadingDoc}
                                                >
                                                    <Text style={styles.addFirstImageText}>Add First Image</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    )}
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </View>

                {/* Upgrade Plan Card */}
                {/* Upgrade Plan Card */}


                {/* Premium Plan Modal */}
                <Modal
                    visible={showPremiumModal}
                    transparent={true}
                    animationType="slide"
                    onRequestClose={() => {

                        setShowPremiumModal(false);
                    }}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                            <View style={styles.modalHeader}>
                                <Icon name="crown" size={32} color={COLORS.warning} />
                                <Text style={styles.modalTitle}>Premium Plan</Text>
                                <TouchableOpacity
                                    style={styles.closeButton}
                                    onPress={() => {

                                        setShowPremiumModal(false);
                                    }}
                                >
                                    <Icon name="times" size={20} color="#666" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.modalBody}>
                                <Text style={styles.modalSubtitle}>Unlock exclusive features for your business</Text>

                                {/* Plan Comparison */}
                                <View style={{ marginBottom: 24 }}>
                                    {/* Standard Plan Column */}
                                    {/* <View style={{ marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 16 }}>
                                        <Text style={{ fontSize: 14, fontWeight: '700', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' }}>Standard Plan (Current)</Text>
                                        <View style={styles.featureItem}>
                                            <Icon name="check-circle" size={12} color="#94a3b8" style={{ marginRight: 10 }} />
                                            <Text style={[styles.featureText, { color: '#64748b' }]}>3 Chits Only</Text>
                                        </View>
                                        <View style={styles.featureItem}>
                                            <Icon name="check-circle" size={12} color="#94a3b8" style={{ marginRight: 10 }} />
                                            <Text style={[styles.featureText, { color: '#64748b' }]}>Normal Dashboard</Text>
                                        </View>
                                        <View style={styles.featureItem}>
                                            <Icon name="times-circle" size={12} color="#ef4444" style={{ marginRight: 10 }} />
                                            <Text style={[styles.featureText, { color: '#64748b' }]}>No Shop Image Uploads</Text>
                                        </View>
                                        <View style={styles.featureItem}>
                                            <Icon name="exclamation-circle" size={12} color="#f59e0b" style={{ marginRight: 10 }} />
                                            <Text style={[styles.featureText, { color: '#64748b' }]}>Screen Blocking Ads</Text>
                                        </View>
                                        <View style={styles.featureItem}>
                                            <Icon name="check-circle" size={12} color="#94a3b8" style={{ marginRight: 10 }} />
                                            <Text style={[styles.featureText, { color: '#64748b' }]}>Email Support</Text>
                                        </View>
                                    </View> */}

                                    {/* Premium Plan Column */}
                                    <View>
                                        {/* <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.warning, marginBottom: 12, textTransform: 'uppercase' }}>Premium Plan (Upgrade)</Text> */}

                                        <View style={[styles.featureItem, { backgroundColor: '#FFFBEB' }]}>
                                            <View style={[styles.featureIconContainer, { backgroundColor: COLORS.warning }]}>
                                                <Icon name="check" size={10} color="#fff" />
                                            </View>
                                            <Text style={[styles.featureText, { color: '#92400E', fontWeight: '700' }]}>Up to 6 Chits</Text>
                                        </View>

                                        <View style={[styles.featureItem, { backgroundColor: '#FFFBEB' }]}>
                                            <View style={[styles.featureIconContainer, { backgroundColor: COLORS.warning }]}>
                                                <Icon name="chart-pie" size={10} color="#fff" />
                                            </View>
                                            <Text style={[styles.featureText, { color: '#92400E', fontWeight: '700' }]}>Advanced Dashboard</Text>
                                        </View>

                                        <View style={[styles.featureItem, { backgroundColor: '#FFFBEB' }]}>
                                            <View style={[styles.featureIconContainer, { backgroundColor: COLORS.warning }]}>
                                                <Icon name="images" size={10} color="#fff" />
                                            </View>
                                            <Text style={[styles.featureText, { color: '#92400E', fontWeight: '700' }]}>Unlimited Shop Images</Text>
                                        </View>

                                        <View style={[styles.featureItem, { backgroundColor: '#FFFBEB' }]}>
                                            <View style={[styles.featureIconContainer, { backgroundColor: COLORS.warning }]}>
                                                <Icon name="ban" size={10} color="#fff" />
                                            </View>
                                            <Text style={[styles.featureText, { color: '#92400E', fontWeight: '700' }]}>No Screen Blocking Ads</Text>
                                        </View>

                                        <View style={[styles.featureItem, { backgroundColor: '#FFFBEB' }]}>
                                            <View style={[styles.featureIconContainer, { backgroundColor: COLORS.warning }]}>
                                                <Icon name="headset" size={10} color="#fff" />
                                            </View>
                                            <Text style={[styles.featureText, { color: '#92400E', fontWeight: '700' }]}>24/7 Support</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Toggle Container */}
                                <View style={styles.toggleContainer}>
                                    <TouchableOpacity
                                        style={[styles.toggleButton, billingCycle === 'monthly' && styles.toggleButtonActive]}
                                        onPress={() => setBillingCycle('monthly')}
                                    >
                                        <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.toggleButton, billingCycle === 'yearly' && styles.toggleButtonActive]}
                                        onPress={() => setBillingCycle('yearly')}
                                    >
                                        <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}>
                                            Yearly <Text style={{ fontSize: 10 }}>(Save 17%)</Text>
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.priceContainer}>
                                    {/* <Text style={styles.priceLabel}>Plan Price</Text> */}
                                    <Text style={styles.priceValue}>
                                        {billingCycle === 'monthly' ? '₹2,500' : '₹25,000'} <Text style={styles.pricePeriod}>/ {billingCycle === 'monthly' ? 'Month' : 'Year'}</Text>
                                    </Text>
                                </View>
                            </ScrollView>

                            <View style={styles.modalFooter}>
                                <TouchableOpacity
                                    style={styles.payButton}
                                    onPress={() => {
                                        // Resume ads right before payment so logic can continue, 
                                        // OR keep paused until payment done? Usually good to resume if we close modal.
                                        // But actually, Razorpay takes over. We can resume ads now, 
                                        // BUT if ad pops over Razorpay? 
                                        // Better to resume ads ONLY after we are truly done or cancelled.
                                        // However, handleUpgradePayment is async fire-and-forget here?
                                        // Let's resume ads to reset state, but maybe with a delay?
                                        // Safest: Resume ads now. The ad timer is 5 mins.

                                        setShowPremiumModal(false);
                                        handleUpgradePayment(billingCycle);
                                    }}
                                >
                                    <Text style={styles.payButtonText}>Pay & Upgrade</Text>
                                    <Icon name="arrow-right" size={16} color="#fff" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => setShowLogoutModal(true)}
                >
                    <Icon name="sign-out-alt" size={16} color={COLORS.danger} />
                    <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

                <View style={styles.footerSpace} />
            </ScrollView >

            {isEditingProfile && (
                <View style={styles.floatingButtonContainer}>
                    <TouchableOpacity
                        style={[styles.floatingSaveButton, updatingProfile && styles.saveButtonDisabled]}
                        onPress={() => handleUpdateProfile(profileData)}
                        disabled={updatingProfile}
                    >
                        {updatingProfile ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <>
                                <Icon name="check" size={18} color="#fff" />
                                <Text style={styles.floatingSaveButtonText}>Save Changes</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View >
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        padding: 16,
        backgroundColor: '#f8fafc',
    },
    // Minimal Profile Header Styles
    profileHeaderMinimal: {
        backgroundColor: COLORS.glass,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    profileRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainerMinimal: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E8F4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        overflow: 'hidden',
    },
    avatarMinimal: {
        width: '100%',
        height: '100%',
        borderRadius: 25,
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.primary,
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    profileInfoMinimal: {
        flex: 1,
        justifyContent: 'center',
    },
    profileNameMinimal: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    planBadgeMinimal: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF8E1',
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    planTextMinimal: {
        fontSize: 12,
        color: '#F59E0B',
        fontWeight: '600',
        marginLeft: 4,
    },
    editBtnMinimal: {
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    editBtnTextMinimal: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },

    // Legacy Styles (kept to prevent crashes if referenced elsewhere, though mostly replaced)
    profileHeaderCard: {
        backgroundColor: COLORS.glass,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    // Common Card Styles
    card: {
        backgroundColor: COLORS.glass,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    cardHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginLeft: 10,
    },
    cardStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#64748b',
    },
    // Edit Form Styles
    editForm: {
        marginTop: 8,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#475569',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: '#1e293b',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    readOnlyInput: {
        backgroundColor: '#f1f5f9',
        borderColor: '#cbd5e1',
        color: '#64748b',
    },
    // Floating Button Styles
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        elevation: 10,
        zIndex: 100,
    },
    floatingSaveButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 30, // Pill shape
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    floatingSaveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
        letterSpacing: 0.5,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    // Legacy Button (if still referenced)
    saveButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Details Grid Styles
    detailsGrid: {
        marginTop: 8,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        paddingVertical: 4,
    },
    detailIcon: {
        marginTop: 2,
        marginRight: 12,
        width: 16,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#64748b',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '500',
        color: '#1e293b',
        lineHeight: 22,
    },
    // Bank Details Styles
    verifiedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.success,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    verifiedTagText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    unverifiedTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f59e0b',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    unverifiedTagText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    verifiedInfo: {
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        padding: 12,
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(34, 197, 94, 0.2)',
    },
    verifiedInfoText: {
        fontSize: 14,
        color: '#059669',
        fontWeight: '500',
    },
    verifiedName: {
        fontWeight: '700',
    },
    bankForm: {
        marginTop: 8,
    },
    verifyButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
    },
    verifyButtonDisabled: {
        opacity: 0.7,
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    // Documents Styles
    documentsSection: {
        marginTop: 8,
    },
    documentItem: {
        marginBottom: 24,
    },
    documentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    documentTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginLeft: 10,
    },
    documentCount: {
        fontSize: 14,
        color: '#64748b',
        marginLeft: 6,
    },
    documentPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    documentImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 16,
    },
    documentInfo: {
        flex: 1,
    },
    documentName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 4,
    },
    documentStatus: {
        fontSize: 12,
        color: COLORS.success,
        fontWeight: '500',
    },
    documentAction: {
        padding: 8,
    },
    uploadDocumentButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        borderRadius: 12,
        paddingVertical: 24,
    },
    uploadDocumentText: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: 12,
    },
    emptyDocument: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        paddingVertical: 24,
    },
    emptyDocumentText: {
        fontSize: 14,
        color: '#94a3b8',
        marginLeft: 8,
        fontStyle: 'italic',
    },
    // Shop Images Styles
    shopImagesScroll: {
        marginVertical: 8,
    },
    shopImageContainer: {
        width: 120,
        height: 120,
        borderRadius: 12,
        marginRight: 12,
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        overflow: 'hidden',
        position: 'relative',
    },
    shopImage: {
        width: '100%',
        height: '100%',
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addImageButton: {
        width: 120,
        height: 120,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
    },
    addImageText: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '500',
        marginTop: 8,
    },
    noImagesContainer: {
        width: width - 72,
        height: 120,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
    },
    noImagesText: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 8,
        marginBottom: 12,
    },
    addFirstImageButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
    },
    addFirstImageText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    // Upgrade Card Styles
    upgradeCard: {
        backgroundColor: COLORS.glass,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    upgradeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
    },
    upgradeBadge: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    upgradeInfo: {
        flex: 1,
        marginRight: 16,
    },
    upgradeTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#92400e',
        marginBottom: 4,
    },
    upgradeDescription: {
        fontSize: 13,
        color: '#92400e',
        opacity: 0.8,
        lineHeight: 18,
    },
    upgradeButton: {
        backgroundColor: COLORS.warning,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    upgradeButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginLeft: 6,
    },
    // Logout Button
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: 'rgba(239, 68, 68, 0.2)',
    },
    logoutText: {
        color: COLORS.danger,
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 12,
    },
    footerSpace: {
        height: 32,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '70%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        position: 'relative',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.dark,
        marginLeft: 12,
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        padding: 8,
    },
    modalBody: {
        flex: 1,
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#64748b',
        textAlign: 'center',
        marginBottom: 32,
        fontWeight: '500',
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: '#f8fafc',
        padding: 16,
        borderRadius: 16,
    },
    featureIconContainer: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.success,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    featureText: {
        fontSize: 16,
        color: '#334155',
        fontWeight: '600',
    },
    priceContainer: {
        marginTop: 12,
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    priceLabel: {
        fontSize: 12,
        color: '#92400e',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    priceValue: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.warning,
    },
    pricePeriod: {
        fontSize: 12,
        color: '#92400e',
        fontWeight: '600',
    },
    modalFooter: {
        marginTop: 24,
    },
    payButton: {
        backgroundColor: COLORS.dark,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        borderRadius: 16,
        shadowColor: COLORS.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
    },
    payButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    // Toggle Styles
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#f1f5f9',
        borderRadius: 25,
        padding: 4,
        marginBottom: 20,
        marginHorizontal: 10,
    },
    toggleButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 20,
    },
    toggleButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    toggleText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.secondary,
    },
    toggleTextActive: {
        color: COLORS.primary,
    },
    removeLogoBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginBottom: 16,
        backgroundColor: '#fef2f2',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#fee2e2',
    },
    removeLogoText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#ef4444',
        marginLeft: 8,
    },
});

export default MerchantProfile;