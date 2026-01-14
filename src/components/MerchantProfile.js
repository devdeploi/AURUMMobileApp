/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator, StyleSheet, Dimensions, Modal } from 'react-native';
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
    onLogout
}) => {
    const [showPremiumModal, setShowPremiumModal] = useState(false);

    return (
        <ScrollView
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            {/* Profile Header Card */}
            <View style={styles.profileHeaderCard}>
                <View style={styles.profileAvatarContainer}>
                    <View style={styles.avatarWrapper}>
                        <Icon name="user-circle" size={80} color={COLORS.primary} />
                        <View style={styles.verificationBadge}>
                            <Icon name="check-circle" size={16} color="#fff" />
                        </View>
                    </View>
                </View>

                <Text style={styles.profileName}>{profileData.name || user.name}</Text>

                <View style={styles.businessTag}>
                    <Icon name="store" size={12} color={COLORS.primary} style={styles.storeIcon} />
                    <Text style={styles.businessTagText}>Business Account</Text>
                </View>

                <View style={styles.planBadge}>
                    <Icon name="crown" size={14} color={COLORS.warning} />
                    <Text style={styles.planText}>{profileData.plan || 'Standard'} Plan</Text>
                </View>

                <TouchableOpacity
                    style={styles.editProfileButton}
                    onPress={() => setIsEditingProfile(!isEditingProfile)}
                >
                    <Icon name="edit" size={14} color={COLORS.primary} />
                    <Text style={styles.editProfileButtonText}>
                        {isEditingProfile ? 'Cancel Editing' : 'Edit Profile'}
                    </Text>
                </TouchableOpacity>
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

                        <View style={styles.inputRow}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.inputLabel}>Phone</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profileData.phone}
                                    onChangeText={(text) => setProfileData({ ...profileData, phone: text })}
                                    keyboardType="phone-pad"
                                    placeholder="Phone number"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.inputLabel}>GSTIN</Text>
                                <TextInput
                                    style={styles.input}
                                    value={profileData.gstin}
                                    onChangeText={(text) => setProfileData({ ...profileData, gstin: text })}
                                    placeholder="GSTIN Number"
                                />
                            </View>
                        </View>

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

                        <TouchableOpacity
                            style={[styles.saveButton, updatingProfile && styles.saveButtonDisabled]}
                            onPress={handleUpdateProfile}
                            disabled={updatingProfile}
                        >
                            {updatingProfile ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Icon name="check-circle" size={16} color="#fff" />
                                    <Text style={styles.saveButtonText}>Save Changes</Text>
                                </>
                            )}
                        </TouchableOpacity>
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

                    {profileData.bankDetails?.verificationStatus === 'verified' ? (
                        <View style={styles.verifiedTag}>
                            <Icon name="check-circle" size={12} color="#fff" />
                            <Text style={styles.verifiedTagText}>Verified</Text>
                        </View>
                    ) : (
                        <View style={styles.unverifiedTag}>
                            <Icon name="exclamation-circle" size={12} color="#fff" />
                            <Text style={styles.unverifiedTagText}>Pending</Text>
                        </View>
                    )}
                </View>

                {profileData.bankDetails?.verificationStatus === 'verified' && (
                    <View style={styles.verifiedInfo}>
                        <Text style={styles.verifiedInfoText}>
                            Verified as: <Text style={styles.verifiedName}>{profileData.bankDetails.verifiedName}</Text>
                        </Text>
                    </View>
                )}

                <View style={styles.bankForm}>
                    <View style={styles.inputRow}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
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

                        <View style={[styles.inputGroup, { flex: 1 }]}>
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
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>IFSC Code</Text>
                        <TextInput
                            style={[styles.input, !isEditingProfile && styles.readOnlyInput]}
                            value={profileData.bankDetails?.ifscCode}
                            editable={isEditingProfile}
                            onChangeText={(text) => setProfileData({
                                ...profileData,
                                bankDetails: { ...profileData.bankDetails, ifscCode: text }
                            })}
                            autoCapitalize="characters"
                            placeholder="IFSC code"
                        />
                    </View>

                    {isEditingProfile && (
                        <TouchableOpacity
                            style={[styles.verifyButton, verifyingBank && styles.verifyButtonDisabled]}
                            onPress={verifyBankAccount}
                            disabled={verifyingBank}
                        >
                            {verifyingBank ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Icon name="shield-alt" size={14} color="#fff" />
                                    <Text style={styles.verifyButtonText}>Verify Account</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
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
                        <View style={styles.documentHeader}>
                            <Icon name="images" size={16} color={COLORS.secondary} />
                            <Text style={styles.documentTitle}>Shop Images</Text>
                            <Text style={styles.documentCount}>({profileData.shopImages?.length || 0})</Text>
                        </View>

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
                    </View>
                </View>
            </View>

            {/* Upgrade Plan Card */}
            {/* Upgrade Plan Card */}
            {profileData.plan !== 'Premium' && (
                <TouchableOpacity
                    style={styles.upgradeCard}
                    activeOpacity={0.9}
                    onPress={() => setShowPremiumModal(true)}
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

            {/* Premium Plan Modal */}
            <Modal
                visible={showPremiumModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowPremiumModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Icon name="crown" size={32} color={COLORS.warning} />
                            <Text style={styles.modalTitle}>Premium Plan</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowPremiumModal(false)}
                            >
                                <Icon name="times" size={20} color="#666" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <Text style={styles.modalSubtitle}>Unlock exclusive features for your business</Text>

                            {/* <View style={styles.featureItem}>
                                <View style={styles.featureIconContainer}>
                                    <Icon name="check" size={12} color="#fff" />
                                </View>
                                <Text style={styles.featureText}>Verified Merchant Badge</Text>
                            </View> */}

                            <View style={styles.featureItem}>
                                <View style={styles.featureIconContainer}>
                                    <Icon name="check" size={12} color="#fff" />
                                </View>
                                <Text style={styles.featureText}>Manage up to 6 chits</Text>
                            </View>

                            <View style={styles.featureItem}>
                                <View style={styles.featureIconContainer}>
                                    <Icon name="check" size={12} color="#fff" />
                                </View>
                                <Text style={styles.featureText}>Advanced Analytics</Text>
                            </View>

                            <View style={styles.featureItem}>
                                <View style={styles.featureIconContainer}>
                                    <Icon name="check" size={12} color="#fff" />
                                </View>
                                <Text style={styles.featureText}>Priority 24/7 Support</Text>
                            </View>

                            <View style={styles.priceContainer}>
                                {/* <Text style={styles.priceLabel}>Plan Price</Text> */}
                                <Text style={styles.priceValue}>Rs 5000 <Text style={styles.pricePeriod}>/ Month</Text></Text>
                            </View>
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.payButton}
                                onPress={() => {
                                    setShowPremiumModal(false);
                                    handleUpgradePayment();
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
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    contentContainer: {
        padding: 16,
        backgroundColor: '#f8fafc',
    },
    // Profile Header Card
    profileHeaderCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    profileAvatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatarWrapper: {
        position: 'relative',
    },
    verificationBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: COLORS.success,
        borderRadius: 12,
        padding: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
        textAlign: 'center',
    },
    businessTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(145, 82, 0, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 12,
    },
    storeIcon: {
        marginRight: 6,
    },
    businessTagText: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.primary,
    },
    planBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
    },
    planText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.warning,
        marginLeft: 6,
    },
    editProfileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(145, 82, 0, 0.05)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(145, 82, 0, 0.2)',
    },
    editProfileButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginLeft: 8,
    },
    // Common Card Styles
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
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
    saveButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginTop: 8,
    },
    saveButtonDisabled: {
        opacity: 0.7,
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
        backgroundColor: 'linear-gradient(135deg, rgba(145, 82, 0, 0.1), rgba(245, 158, 11, 0.1))',
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
});

export default MerchantProfile;