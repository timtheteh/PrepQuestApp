import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, TouchableWithoutFeedback, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllCompanyNames, getCompanyIconByName } from '@/db/decks';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuestionTextBarWithDropdownProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  helperText?: string;
  showDropdown?: boolean;
}

interface CompanyOption {
  name: string;
  icon?: { uri: string };
}

export function QuestionTextBarWithDropdown({
  label,
  placeholder,
  value,
  onChangeText,
  helperText,
  showDropdown = false
}: QuestionTextBarWithDropdownProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    if (showDropdown && isDropdownOpen) {
      loadCompanies();
    }
  }, [showDropdown, isDropdownOpen]);

  const loadCompanies = async () => {
    if (companies.length > 0) return; // Already loaded
    
    setLoading(true);
    try {
      const companyNames = await getAllCompanyNames();
      const companyOptions: CompanyOption[] = [];
      
      // Load icons for each company
      for (const name of companyNames) {
        const icon = await getCompanyIconByName(name);
        companyOptions.push({
          name,
          icon
        });
      }
      
      setCompanies(companyOptions);
    } catch (error) {
      console.error('Error loading companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    onChangeText('');
  };

  const handleDropdownToggle = () => {
    if (showDropdown) {
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const handleCompanySelect = (companyName: string) => {
    onChangeText(companyName);
    setIsDropdownOpen(false);
  };

  const handleInputChange = (text: string) => {
    onChangeText(text);
    // Keep dropdown open when typing and show filtered results
    if (showDropdown && !isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputFocus = () => {
    if (showDropdown && !isDropdownOpen) {
      setIsDropdownOpen(true);
    }
  };

  // Filter companies based on current input
  const filteredCompanies = companies.filter(company => {
    if (!value.trim()) {
      return true; // Show all companies when input is empty
    }
    return company.name.toLowerCase().startsWith(value.toLowerCase());
  }).sort((a, b) => a.name.localeCompare(b.name)); // Ensure alphabetical order

  return (
    <View style={styles.inputRow}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.textInputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={placeholder}
          value={value}
          onChangeText={handleInputChange}
          onFocus={handleInputFocus}
        />
        <View style={styles.rightButtonsContainer}>
          {value.length > 0 && (
            <TouchableWithoutFeedback onPress={handleClear}>
              <View style={styles.closeButtonContainer}>
                <Ionicons
                  name={Platform.OS === 'ios' ? 'close-circle' : 'close-circle'}
                  size={24}
                  color="#D5D4DD"
                />
              </View>
            </TouchableWithoutFeedback>
          )}
          {showDropdown && (
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={handleDropdownToggle}
            >
              <Ionicons
                name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {showDropdown && isDropdownOpen && (
        <View style={styles.dropdownContainer}>
          <View style={styles.dropdownHeader}>
            <Text style={styles.dropdownHeaderText}>
              {value.trim() ? (language === 'Chinese' ? `以 "${value}" 开头的公司` : `Companies starting with "${value}"`) : (language === 'Chinese' ? '选择一个公司' : 'Select a company')}
            </Text>
            <TouchableOpacity 
              style={styles.closeDropdownButton}
              onPress={() => setIsDropdownOpen(false)}
            >
              <Ionicons name="close" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.dropdownScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {loading ? (
              <Text style={styles.loadingText}>Loading companies...</Text>
            ) : filteredCompanies.length === 0 ? (
              <Text style={styles.loadingText}>
                {value.trim() ? (language === 'Chinese' ? `没有以 "${value}" 开头的公司` : `No companies found starting with "${value}"`) : (language === 'Chinese' ? '没有公司' : 'No companies found')}
              </Text>
            ) : (
              filteredCompanies.map((company) => (
                <TouchableOpacity
                  key={company.name}
                  style={styles.dropdownItem}
                  onPress={() => handleCompanySelect(company.name)}
                >
                  <Text style={styles.dropdownItemText}>{company.name}</Text>
                  {company.icon && (
                    <Image 
                      source={company.icon} 
                      style={styles.companyIcon}
                      resizeMode="contain"
                    />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      )}
      
      {helperText && (
        <Text style={styles.helperText}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputRow: {
    marginBottom: 24,
  },
  label: {
    fontSize: 24,
    fontFamily: 'Neuton-Regular',
    color: '#000000',
    marginBottom: 16,
    height: 32
  },
  textInputContainer: {
    height: 46,
    backgroundColor: '#F8F8F8',
    borderRadius: 30,
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    paddingVertical: 0,
  },
  rightButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButtonContainer: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownButton: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  dropdownContainer: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    color: '#000000',
  },
  closeDropdownButton: {
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownScrollView: {
    maxHeight: 160,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    color: '#000000',
    flex: 1,
  },
  companyIcon: {
    width: 24,
    height: 24,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Medium',
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  helperText: {
    fontFamily: 'Satoshi-MediumItalic',
    fontSize: 16,
    color: '#000000',
    marginTop: 8,
    opacity: 0.5,   
  },
}); 