import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
// import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackButton from '../shared/BackButton';
import PrimaryButton from '../shared/PrimaryButton';
import commonStyles from '../shared/commonStyles';

export default function TermsScreen() {
  const [canContinue, setCanContinue] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const handleScroll = (event: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    ) {
      setCanContinue(true);
    }
  };

  const handleContinue = () => {
    if (canContinue) {
      router.push('/components/verify-details');
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* <StatusBar barStyle="dark-content" backgroundColor={colors.statusbar_black} /> */}
      <SafeAreaView style={commonStyles.container_layout}>
        <View style={styles.header}>
          <BackButton title='Back' onPress={handleBack} />
          <Text style={styles.title}>Terms & Conditions</Text>
          <Text style={styles.subtitle}>
            Please read carefully before proceeding
          </Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={true}
        >
          <View style={styles.termsContainer}>
            <Text style={styles.sectionTitle}>1. Standard terms-and-conditions</Text>
            <Text style={styles.termsText}>
              By accessing and using the Curronn application, you accept and
              agree to be bound by the terms and provision of this agreement.
            </Text>

            <Text style={styles.sectionTitle}>2. Use License</Text>

            <Text style={styles.termsText}>
              Permission is granted to temporarily download one copy of the
              application for personal, non-commercial transitory viewing only.
              This is the grant of a license, not a transfer of title.
            </Text>

            <Text style={styles.sectionTitle}>3. Disclaimer</Text>

            <Text style={styles.termsText}>
              The materials on Curronn&apos;s application are provided on an
              &apos;as is&apos; basis. Curronn makes no warranties, expressed or
              implied, and hereby disclaims and negates all other warranties
              including without limitation, implied warranties or conditions of
              merchantability, fitness for a particular purpose, or
              non-infringement of intellectual property or other violation of
              rights.
            </Text>

            <Text style={styles.sectionTitle}>4. Limitations</Text>

            <Text style={styles.termsText}>
              In no event shall Curronn or its suppliers be liable for any
              damages (including, without limitation, damages for loss of data
              or profit, or due to business interruption) arising out of the use
              or inability to use the materials on Curronn&apos;s application.
            </Text>

            <Text style={styles.sectionTitle}>5. Accuracy of Materials</Text>

            <Text style={styles.termsText}>
              The materials appearing on Curronn&apos;s application could
              include technical, typographical, or photographic errors. Curronn
              does not warrant that any of the materials on its application are
              accurate, complete or current.
            </Text>

            <Text style={styles.sectionTitle}>6. Links</Text>
            <Text style={styles.termsText}>
              Curronn has not reviewed all of the sites linked to its
              application and is not responsible for the contents of any such
              linked site. The inclusion of any link does not imply endorsement
              by Curronn of the site.
            </Text>

            <Text style={styles.sectionTitle}>7. Modifications</Text>
            <Text style={styles.termsText}>
              Curronn may revise these terms of service for its application at
              any time without notice. By using this application you are
              agreeing to be bound by the then current version of these Terms of
              Service.
            </Text>

            <Text style={styles.sectionTitle}>8. Governing Law</Text>
            <Text style={styles.termsText}>
              These terms and conditions are governed by and construed in
              accordance with the laws and you irrevocably submit to the
              exclusive jurisdiction of the courts in that state or location.
            </Text>

            <View style={styles.scrollIndicator}>
              <Text style={styles.scrollText}>
                {canContinue
                  ? '✅ You have read all terms'
                  : '📜 Please scroll to read all terms'}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title='I Agree'
            onPress={handleContinue}
            disabled={!canContinue}
            style={{width:'60%', borderRadius:8}}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // ...commonStyles.container_layout,
    flex: 1,
    backgroundColor: '#F2F6FF'
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'left',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'left',
  },
  scrollContainer: {
    flex: 1,
  },
  termsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'left',
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#000000',
    marginBottom: 8,
    textAlign: 'left',
  },
  scrollIndicator: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  scrollText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonContainer: {
    marginTop: 10,
    alignItems: 'center',
    // backgroundColor: '#6200ee'
  },
  backButton: {
    flex: 1,
    height: 45,
    borderRadius: 28,
    borderColor: '#6200ee',
  },
  backButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200ee',
  },

  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});
