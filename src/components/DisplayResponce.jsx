import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition-es";
import { getApiMessage } from "../app/features/cohereSlice";
import {
  getRawPrompt,
  getResponcePrompt,
} from "../app/features/translateSlice";
import { countries } from "../extras/contries";
import styles from "./display.module.css";

function DisplayResponce() {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState("");
  const [englishResponce, setEnglishResponce] = useState("");
  const [translatedResponce, setTranslatedResponce] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("en");
  const [spoken, setSpoken] = useState(false); // Add spoken state

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  const dispatch = useDispatch();
  const translatorFromSelector = useSelector(
    (state) => state.translation.translatestFromText
  );
  const translatorToSelector = useSelector(
    (state) => state.translation.translatestToText
  );
  const translatedResponceSelector = useSelector(
    (state) => state.translation.translatedResponse
  );
  const getAiResponceFromCohere = useSelector(
    (state) => state.cohere.apiResponces
  );
  const cohereLoading = useSelector((state) => state.cohere.loading);
  const loadingState = useSelector((state) => state.translation.loading);

  const startListning = () => {
    setIsListening(true);
    SpeechRecognition.startListening({ continuous: true });
  };

  const stopListning = () => {
    setIsListening(false);
    SpeechRecognition.stopListening();
  };

  const cancelSpeech = () => {
    speechSynthesis.cancel(); // Cancel any ongoing utterance
    setSpoken(false); // Reset spoken state so that the speech can start again if needed
  };

  if (!browserSupportsSpeechRecognition) {
    return <alert>Browser doesn't support speech recognition.</alert>;
  }

  const handelFetchCohereData = () => {
    stopListning();
    setSpoken(false); // Reset spoken state before new fetch

    if (selectedCountry !== "en") {
      dispatch(
        getRawPrompt({
          text: inputText,
          fromText: selectedCountry,
          toText: "en",
        })
      );
      dispatch(getApiMessage(translatorFromSelector));
    } else {
      dispatch(getApiMessage(inputText));
    }
  };

  useEffect(() => {
    if (getAiResponceFromCohere && selectedCountry !== "en") {
      dispatch(
        getResponcePrompt({
          text: getAiResponceFromCohere,
          fromText: "en",
          toText: selectedCountry,
        })
      );
    } else {
      setEnglishResponce(getAiResponceFromCohere);
    }
  }, [getAiResponceFromCohere, selectedCountry, dispatch]);

  useEffect(() => {
    setInputText(transcript);
  }, [transcript]);

  useEffect(() => {
    if (translatedResponceSelector) {
      setTranslatedResponce(translatedResponceSelector);
    }
  }, [translatedResponceSelector]);

  useEffect(() => {
    let textToSpeak;
    let utterance;

    if (!spoken) {
      if (selectedCountry === "en") {
        textToSpeak = getAiResponceFromCohere;
        utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = "en";
      } else {
        textToSpeak = translatedResponce;
        utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = selectedCountry;
      }

      if (textToSpeak) {
        speechSynthesis.cancel(); // Ensure previous utterances are stopped
        utterance.onend = () => setSpoken(true); // Mark as spoken only after finishing
        speechSynthesis.speak(utterance);
      }
    }
  }, [
    englishResponce,
    getAiResponceFromCohere,
    selectedCountry,
    translatedResponce,
    spoken,
  ]);

  useEffect(() => {
    setSpoken(false);
  }, [englishResponce, translatedResponce]);

  const handleTextInput = (e) => {
    setInputText(e.target.value);
  };

  const handleCountryChange = (e) => {
    setSelectedCountry(e.target.value);
  };

  return (
    <>
      <div className={styles.screen}>
        <div className={styles.contentContainer}>
          <textarea
            className={styles.textarea}
            cols="30"
            rows="10"
            value={inputText}
            onChange={handleTextInput}
          ></textarea>

          <p>Microphone: {listening ? "on" : "off"}</p>

          <div className={styles.controls}>
            <select
              className={styles.select}
              value={selectedCountry}
              onChange={handleCountryChange}
            >
              <option value="">Select a Language</option>
              {Object.entries(countries).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
            <button className={styles.button} onClick={startListning}>
              Enable Voice Input
            </button>
            <button className={styles.button} onClick={cancelSpeech}>
              Cancel Speech
            </button>
            <button className={styles.button} onClick={resetTranscript}>
              Reset
            </button>
            <button className={styles.button} onClick={handelFetchCohereData}>
              Fetch
            </button>{" "}
            {/* New Cancel Speech Button */}
          </div>
          <div className={styles.responceText}>
            <p style={{ color: "red", background: "white", padding: "1px" }}>
              NOTE: If you are testing this application note that I'm using a
              paid API to generate responses, hence the number of responses and
              the length of responses will be limited because I manually fixed
              it to 50 characters per fetch.
            </p>
            <p>
              {loadingState || cohereLoading
                ? "Loading..."
                : translatedResponce || englishResponce}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default DisplayResponce;
