import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Platform, TouchableWithoutFeedback, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllCompanyNames, getCompanyIconByName } from '@/db/decks';
import { useLanguage } from '@/contexts/LanguageContext';
import { strings } from '@/constants/strings';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/Fonts';

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
  const { theme } = useTheme();

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
      <Text style={[styles.label, { color: Colors[theme].text }]}>{label}</Text>
      <View style={[styles.textInputContainer, { backgroundColor: Colors[theme].secondaryShade }]}>
        <TextInput
          style={[styles.textInput, { color: Colors[theme].text }]}
          placeholder={placeholder}
          placeholderTextColor={Colors[theme].unselectedText}
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
                  color={Colors[theme].unselectedText}
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
                color={Colors[theme].unselectedText}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {showDropdown && isDropdownOpen && (
        <View style={[styles.dropdownContainer, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].secondaryShade }]}>
          <View style={[styles.dropdownHeader, { borderBottomColor: Colors[theme].secondaryShade }]}>
            <Text style={[styles.dropdownHeaderText, { color: Colors[theme].text }]}>
              {value.trim() ? `${strings[language].companiesStartingWith} "${value}"` : strings[language].selectACompany}
            </Text>
            <TouchableOpacity 
              style={styles.closeDropdownButton}
              onPress={() => setIsDropdownOpen(false)}
            >
              <Ionicons name="close" size={20} color={Colors[theme].unselectedText} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            style={styles.dropdownScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {loading ? (
              <Text style={[styles.loadingText, { color: Colors[theme].unselectedText }]}>{strings[language].loadingCompanies}</Text>
            ) : filteredCompanies.length === 0 ? (
              <Text style={[styles.loadingText, { color: Colors[theme].unselectedText }]}>
                {value.trim() ? `${strings[language].noCompaniesFoundStartingWith} "${value}"` : strings[language].noCompaniesFound}
              </Text>
            ) : (
              filteredCompanies.map((company) => (
                <TouchableOpacity
                  key={company.name}
                  style={[styles.dropdownItem, { borderBottomColor: Colors[theme].secondaryShade }]}
                  onPress={() => handleCompanySelect(company.name)}
                >
                  <Text style={[styles.dropdownItemText, { color: Colors[theme].text }]}>{company.name}</Text>
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
        <Text style={[styles.helperText, { color: Colors[theme].text }]}>{helperText}</Text>
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
    fontFamily: Fonts.title,
    marginBottom: 16,
    height: 32
  },
  textInputContainer: {
    height: 46,
    borderRadius: 30,
    justifyContent: 'center',
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
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
    borderRadius: 12,
    borderWidth: 1,
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
  },
  dropdownHeaderText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
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
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    flex: 1,
  },
  companyIcon: {
    width: 24,
    height: 24,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: Fonts.bodyMedium,
    textAlign: 'center',
    paddingVertical: 20,
  },
  helperText: {
    fontFamily: Fonts.bodyItalic,
    fontSize: 16,
    marginTop: 8,
    opacity: 0.5,   
  },
}); 