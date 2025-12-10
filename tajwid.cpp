#include <emscripten/bind.h>
#include <string>
#include <vector>

using namespace emscripten;

// Struktur data tajwid
struct TajwidEntry {
    std::string huruf;
    std::string hukum;
    std::string penjelasan;
    std::vector<std::string> contoh;
};

// Data hukum Nun Mati & Tanwin lengkap
std::vector<TajwidEntry> tajwidData = {
    {"أ","Idzhar Halqi","Apabila Nun Sukun atau Tanwin bertemu huruf Idzhar, dibaca jelas tanpa dengung atau samar.","مِنْ اٰيٰتِنَا"},
    {"ه","Idzhar Halqi","Apabila Nun Sukun atau Tanwin bertemu huruf Idzhar, dibaca jelas tanpa dengung atau samar.","مِنْهُمْ"},
    {"ح","Idzhar Halqi","Apabila Nun Sukun atau Tanwin bertemu huruf Idzhar, dibaca jelas tanpa dengung atau samar.","يَوْمًا اَوْ"},
    {"خ","Idzhar Halqi","Apabila Nun Sukun atau Tanwin bertemu huruf Idzhar, dibaca jelas tanpa dengung atau samar.","مِنْ اَمْرِنَا"},
    {"ع","Idzhar Halqi","Apabila Nun Sukun atau Tanwin bertemu huruf Idzhar, dibaca jelas tanpa dengung atau samar.","مِنْ أحَدِهِمَا"},
    {"غ","Idzhar Halqi","Apabila Nun Sukun atau Tanwin bertemu huruf Idzhar, dibaca jelas tanpa dengung atau samar.","مِنْ أحَدِهِمَا"},

    {"ي","Idgham Bighunnah","Apabila Nun Sukun atau Tanwin bertemu huruf Idgham Bighunnah, dibaca masuk ke huruf berikutnya dengan ghunnah (dengung).","مَنْ يَّقُوْلُ"},
    {"ن","Idgham Bighunnah","Apabila Nun Sukun atau Tanwin bertemu huruf Idgham Bighunnah, dibaca masuk ke huruf berikutnya dengan ghunnah (dengung).","بِسُوْرَةٍ مِّنْ"},
    {"م","Idgham Bighunnah","Apabila Nun Sukun atau Tanwin bertemu huruf Idgham Bighunnah, dibaca masuk ke huruf berikutnya dengan ghunnah (dengung).","هُدًى مِّنْ"},
    {"و","Idgham Bighunnah","Apabila Nun Sukun atau Tanwin bertemu huruf Idgham Bighunnah, dibaca masuk ke huruf berikutnya dengan ghunnah (dengung).","فِرَاشاً وَالسَّمَاء"},

    {"ب","Iqlab","Apabila Nun Sukun atau Tanwin bertemu huruf Ba, dibaca menjadi Mim dengan tempo ghunnah (dengung) yang dipanjangkan.","سَمِيْعٌ بَصِيْرٌ"},
    
    // Ikhfa Haqiqi
    {"ت","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","وَالْإِنْجِيلَ"},
    {"ث","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","أَنْزَلَ"},
    {"ج","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","ذُو انْتِقَامٍ"},
    {"د","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","وَالْأُنثَىٰ"},
    {"ذ","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","عَذَابٌ شَدِيدٌ"},
    {"ز","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","عَذَابٌ شَدِيدٌ"},
    {"س","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","وَالْإِنْجِيلَ"},
    {"ش","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","أَنْزَلَ"},
    {"ص","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","ذُو انْتِقَامٍ"},
    {"ض","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","وَالْأُنثَىٰ"},
    {"ط","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","عَذَابٌ شَدِيدٌ"},
    {"ظ","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","وَالْإِنْجِيلَ"},
    {"ف","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","أَنْزَلَ"},
    {"ق","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","ذُو انْتِقَامٍ"},
    {"ك","Ikhfa Haqiqi","Apabila Nun Sukun atau Tanwin bertemu huruf Ikhfa Haqiqi, dibaca disamarkan dengan tempo ghunnah.","وَالْأُنثَىٰ"}
};

// Fungsi analisis: input kalimat → pecah huruf → return array TajwidEntry
std::vector<TajwidEntry> analyzeTajwidSentence(std::string kalimat) {
    std::vector<TajwidEntry> result;
    for (char c : kalimat) {
        std::string s(1,c);
        bool found = false;
        for (auto &entry : tajwidData) {
            if (entry.huruf == s) {
                result.push_back(entry);
                found = true;
                break;
            }
        }
        if (!found) {
            result.push_back({"Tidak ditemukan", s, "Huruf tidak sesuai data tajwid.", {}});
        }
    }
    return result;
}

// Binding WASM
EMSCRIPTEN_BINDINGS(tajwid_module) {
    value_object<TajwidEntry>("TajwidEntry")
        .field("hukum", &TajwidEntry::hukum)
        .field("huruf", &TajwidEntry::huruf)
        .field("penjelasan", &TajwidEntry::penjelasan)
        .field("contoh", &TajwidEntry::contoh);

    function("analyzeTajwidSentence", &analyzeTajwidSentence);
}
