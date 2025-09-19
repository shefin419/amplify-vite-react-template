import React, { useState, useEffect, ReactNode, Dispatch, SetStateAction } from "react";
import { FaceLivenessDetector } from "@aws-amplify/ui-react-liveness";
import { Loader, ThemeProvider } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import "./AdminView.css";

import outputs from "../amplify_outputs.json";
import { FiCalendar } from "react-icons/fi";

Amplify.configure(outputs);

type AdminViewProps = {
  buttonName: string;
  punchType: "IN" | "OUT" | null;
  setPunchType: Dispatch<SetStateAction<"IN" | "OUT" | null>>;
};
interface ReferenceImage {
  Bytes?: string;
  S3Object?: { Bucket: string; Name: string };
}
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AuditImage extends ReferenceImage {}

type UploadStatus = ReactNode;

const AdminView: React.FC<AdminViewProps> = ({ buttonName, punchType, setPunchType }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [auditImages, setAuditImages] = useState<AuditImage[]>([]);
  const [regReferenceImage, setRegReferenceImage] = useState<ReferenceImage | null>(null);
  const [atndReferenceImage, setAtndReferenceImage] = useState<ReferenceImage | null>(null);
  const [confidence, setConfidence] = useState(null);
  const [comparisonResult, setComparisonResult] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState<string>("");
  const [showCapturedImage, setShowCapturedImage] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(null);
  const [startRecognition, setStartRecognition] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [branchId, setBranchId] = useState<string>("");
  const [branches, setBranches] = useState<string[]>([]);

  const uniqueUserToken = localStorage.getItem("uniqueUserToken");
  const loginUsername = localStorage.getItem("loginUsername");
  const host = localStorage.getItem("host");
  const loginBranch = localStorage.getItem('loginBranch');
  const branchMap: Record<string, string> = JSON.parse(localStorage.getItem("branchmap") || "{}");

  useEffect(() => {
    const branchDetails = localStorage.getItem("branchDetails");
    if (branchDetails) {
      try {
        const parsedBranches = JSON.parse(branchDetails);
        const branchNames = Object.keys(parsedBranches);
        setBranches(branchNames);
        if (branchNames.length > 0) { // Set branchId to the ID from branchMap instead of the branch name
          const firstBranchName = branchNames[0];
          const firstBranchId = branchMap[firstBranchName] || "";
          setBranchId(firstBranchId);  // Set to "DE000001" instead of "DELHI"
          console.log(confidence,comparisonResult,auditImages,branches);
        }
      } catch (err) {
        setError(new Error("Failed to parse branch details"));
      }
    }
  }, [auditImages, branchMap, branches, comparisonResult, confidence]);

  // Create liveness session when started
  useEffect(() => {
    const fetchSession = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          "https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getsessionid?method=createSession"
        );
        if (!res.ok) throw new Error(res.statusText);
        const { sessionId } = await res.json();
        setSessionId(sessionId);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    fetchSession();

    setAnalysisComplete(false);
    setAuditImages([]);
    setRegReferenceImage(null);
    setAtndReferenceImage(null);
    setConfidence(null);
    setComparisonResult("");
    setShowCapturedImage(false);
    setUploadStatus(null);
    setStartRecognition(false);
    setAttendanceStatus("");
    setError(null);
  }, [buttonName]);

  const handleAnalysisComplete = async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const res = await fetch(
        `https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getsessionid?method=getSessionResults&sessionId=${sessionId}`
      );
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      setAnalysisComplete(true);
      setShowCapturedImage(true);
      setAuditImages(data.auditImages || []);
      setRegReferenceImage(data.referenceImage || null);

      const userToken = localStorage.getItem("fcmToken");

      if (!userToken) {
        setUploadStatus(
          <span style={{ color: "red", fontWeight: 500 }}>
            Token missing. Onboarding failed.
          </span>
        );
        return;
      }

      try {
        const saveTokenResponse = await fetch(
          "https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getAuth",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              host: host,
              username: userName,
              token: userToken,
            }),
          }
        );
        const saveTokenData = await saveTokenResponse.json();

        if (saveTokenData.userid === "Success") {
          const selectedBranchLocation = JSON.parse(localStorage.getItem("selectedBranchLocation") || "{}");
          if (
            !selectedBranchLocation.location ||
            !selectedBranchLocation.location.latitude ||
            !selectedBranchLocation.location.longitude
          ) {
            setAttendanceStatus("Selected branch location not available.");
            return;
          }
         
          const uploadResponse = await fetch(
            `https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getsessionid?method=uploadImagesToS3&sessionId=${sessionId}&userId=${userToken}&userCode=${userName}&companyId=${host}&branchNames=${selectedBranchLocation.branchId}`
          );
          const uploadData = await uploadResponse.json();

          const locationObj = JSON.parse(localStorage.getItem("selectedBranchLocation") || "{}");
          let geoString = "";
          const selectedBranchId = locationObj.branchId;
          if (!selectedBranchId) {
            console.error("Branch ID not available. Please select a branch in App Settings.");
            return;
          }
          if (locationObj.location && locationObj.location.latitude && locationObj.location.longitude) {
            geoString = `${locationObj.location.latitude},${locationObj.location.longitude}`;
          } else {
            console.warn("Location data not available in selectedBranchLocation");
            geoString = ""; // Adjust based on API requirements
          }
          const saveLocationResponse = await fetch(
            "https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getAuth",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                host: host,
                username: userName,
                geo: geoString,
                branch: selectedBranchId, // This should now be "DE000001"
                usergeo: "geo"
              }),
            }
          );
          await saveLocationResponse.json();

          setUploadStatus(
            <span
              style={{
                color:
                  uploadData.message === "Images processed and uploaded successfully" ? "green" : "red",
                fontWeight: 500,
              }}
            >
              ✔️ Onboarding successful.
            </span>
          );
        } else {
          setUploadStatus(
            <span style={{ color: "red", fontWeight: 500 }}>
              ⚠️ Onboarding failed — try again
            </span>
          );
        }
      } catch (saveError) {
        console.error("Error saving token:", saveError);
        setUploadStatus(
          <span style={{ color: "red", fontWeight: 500 }}>
            Error saving token: {(saveError as Error).message}
          </span>
        );
      }
    } catch (err) {
      setError(err as Error);
      setUploadStatus(
        <span style={{ color: "red", fontWeight: 500 }}>
          Error: {(err as Error).message}
        </span>
      );
    } finally {
      setLoading(false);
    }
  };

  const handleComparison = async () => {
    try {
      const response = await fetch(
        `https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getsessionid?method=getSessionResults&sessionId=${sessionId}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setAnalysisComplete(true);
      setAuditImages(data.auditImages);
      setAtndReferenceImage(data.referenceImage);
      setConfidence(data.confidence);
      if (data.confidence > 70) {
        handleCompareFaces();
      } else {
        setAttendanceStatus("User is not live");
      }
    } catch (error) {
      setError(error as Error);
      setAttendanceStatus("Error during analysis");
    }
  };

  const handleCompareFaces = async () => {
    const selectedBranchLocation = JSON.parse(localStorage.getItem("selectedBranchLocation") || "{}");
    if (
      !selectedBranchLocation.location ||
      !selectedBranchLocation.location.latitude ||
      !selectedBranchLocation.location.longitude
    ) {
      setAttendanceStatus("Selected branch location not available.");
      return;
    }

    let userLocation: Coordinates;
    try {
      userLocation = await new Promise<Coordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) =>
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          (error) => reject(error)
        );
      });

      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        selectedBranchLocation.location.latitude,
        selectedBranchLocation.location.longitude
      );
      if (distance > 5) {
        setAttendanceStatus("You are not within 5m of the selected branch.");
        return;
      }

      localStorage.setItem("userLocation", JSON.stringify(userLocation));
    } catch (error) {
      console.error("Error getting user location:", error);
      setAttendanceStatus("Unable to verify location. Please ensure location services are enabled.");
      return;
    }

    try {
      const response = await fetch(
        `https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getsessionid?method=compareWithUserIdAndBranchName&sessionId=${sessionId}&userId=${uniqueUserToken}&userCode=${loginUsername}&companyId=${host}&branchName=${loginBranch}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      const now = new Date();
      const formattedDateTime = now
        .toLocaleString("en-GB", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
        .replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2}:\d{2})/, "$3-$2-$1 $4");

      const currentDate = getCurrentDate();

      if (data.status === "success" && data.message === "Match found") {
        try {
          const savePunchResponse = await fetch(
            "https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getAuth",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                host: host,
                token: "punch",
                username: loginUsername,
                type: punchType,
                time: formattedDateTime,
                date: currentDate,
              }),
            }
          );
          await savePunchResponse.json();
        } catch (saveError) {
          console.error("Error saving punch:", saveError);
          setError(saveError as Error);
        }
        setAttendanceStatus(`✔️ Clock ${punchType} Successful - Match found`);
      } else if (data.status === "wait") {
        setAttendanceStatus(`⏳ Please wait for 2 minutes... And TimeLeft: ${data.timeLeft}seconds `);
        // TimeLeft: ${data.timeLeft}
      } else {
        setAttendanceStatus(`⚠️ Clock ${punchType} failed - ${data.message || "No match found"}`);
      }
      setComparisonResult(data.message);

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            localStorage.setItem(
              "userLocation",
              JSON.stringify({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              })
            );
          },
          (error) => {
            console.error("Error getting location:", error);
            setAttendanceStatus((prev) => `${prev} (Location unavailable)`);
          }
        );
      } else {
        console.error("Geolocation is not supported by this browser.");
        setAttendanceStatus((prev) => `${prev} (Geolocation not supported)`);
      }
    } catch (error) {
      setError(error as Error);
      setAttendanceStatus(`⚠️ Error: ${(error as Error).message}`);
    }
  };

  const handleStartRecognition = () => {
    if (!userName) {
      setError(new Error("Please enter a username"));
      return;
    }
    setStartRecognition(true);
  };

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
  };

  return (
    <>
      {buttonName === "onboarding" && startRecognition && userName ? (
        <ThemeProvider>
          <div className="admin-container">
            {loading ? (
              <Loader />
            ) : analysisComplete ? (
              <div className="liveness_div">
                {showCapturedImage && regReferenceImage && (
                  <div>
                    <p>Captured Image:</p>
                    <img
                      className="result-image"
                      src={
                        regReferenceImage.Bytes
                          ? `data:image/jpeg;base64,${regReferenceImage.Bytes}`
                          : regReferenceImage.S3Object
                          ? `https://${regReferenceImage.S3Object.Bucket}.s3.amazonaws.com/${regReferenceImage.S3Object.Name}`
                          : ""
                      }
                      alt="Captured"
                    />
                  </div>
                )}

                <div className="audit-images">
                  {auditImages.map((img, idx) => (
                    <img
                      key={idx}
                      width={100}
                      src={
                        img.Bytes
                          ? `data:image/jpeg;base64,${img.Bytes}`
                          : img.S3Object
                          ? `https://${img.S3Object.Bucket}.s3.amazonaws.com/${img.S3Object.Name}`
                          : ""
                      }
                      alt={`Audit ${idx + 1}`}
                    />
                  ))}
                </div>

                {uploadStatus && (
                  <div className="upload-status">
                    Onboarding Status: {uploadStatus}
                  </div>
                )}
              </div>
            ) : (
              <div className="liveness_div">
                <FaceLivenessDetector
                  sessionId={sessionId!}
                  region="ap-south-1"
                  onAnalysisComplete={handleAnalysisComplete}
                />
              </div>
            )}
            {error && <div className="error-message">Error: {error.message}</div>}
          </div>
        </ThemeProvider>
      ) : buttonName === "onboarding" ? (
        <div className="admin-container1">
          <div className="input-section">
            <label>
              User Name:
              <input value={userName} onChange={(e) => setUserName(e.target.value)} />
            </label>
            <button className="start-btn" onClick={handleStartRecognition} disabled={!userName}>
              Start Recognition
            </button>
          </div>
        </div>
          ) : buttonName === "appsettings" ? (
      <div className="admin-container1">
        <div className="input-section">
          <label>
            Branch Names
            <select
              value={branchId}
              onChange={(e) => {
                const selectedBranchId = e.target.value;
                setBranchId(selectedBranchId);
                // Save selected branch and current location immediately
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    ({ coords }) => {
                      const branchLocation = {
                        branchId: selectedBranchId,
                        location: {
                          latitude: coords.latitude,
                          longitude: coords.longitude,
                        },
                      };
                      console.log( JSON.stringify(branchLocation),"/////////////////")
                      localStorage.setItem("selectedBranchLocation", JSON.stringify(branchLocation));
                    },
                    (error) => {
                      console.error("Error getting location:", error);
                      const branchLocation = {
                        branchId: selectedBranchId,
                        location: null,
                      };
                      localStorage.setItem("selectedBranchLocation", JSON.stringify(branchLocation));
                    }
                  );
                } else {
                  console.error("Geolocation is not supported by this browser.");
                  const branchLocation = {
                    branchId: selectedBranchId,
                    location: null,
                  };
                  localStorage.setItem("selectedBranchLocation", JSON.stringify(branchLocation));
                }
              }}
              className="branch-select"
            >
              <option value="" disabled>
                Select a branch
              </option>
              {Object.entries(branchMap).map(([name, id]) => (
                <option key={id} value={id}>
                  {name === "HO" ? "Head Ofice" : name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      ) : buttonName === "attendance" ? (
        <>
          <div style={{ display: "flex", justifyContent: "end", padding: "5px" }}>
            <div style={{ display: "flex", gap: "5px" }}>
              <FiCalendar className="calendar-button" size={20} />
              {getCurrentDate()}
            </div>
          </div>
          {punchType === null ? (
            <div className="admin-container1">
              <p className="attandence-header-font-style">Select Attendance Action</p>
              <div className="attendance-date-div">
                <label>
                  <input
                    type="radio"
                    value="IN"
                    checked={punchType === "IN"}
                    onChange={() => setPunchType("IN")}
                  />
                  Clock In
                </label>
                <label>
                  <input
                    type="radio"
                    value="OUT"
                    checked={punchType === "OUT"}
                    onChange={() => setPunchType("OUT")}
                  />
                  Clock Out
                </label>
              </div>
            </div>
          ) : (
            <ThemeProvider>
              <div className="admin-container">
                {loading ? (
                  <Loader />
                ) : (
                  <>
                    {analysisComplete ? (
                      <div className="liveness_div">
                        {atndReferenceImage && (
                          <div>
                            <p style={{ color: "black" }}>Captured Image:</p>
                            <img
                              width="100%"
                              src={
                                atndReferenceImage.Bytes
                                  ? `data:image/jpeg;base64,${atndReferenceImage.Bytes}`
                                  : atndReferenceImage.S3Object
                                  ? `https://${atndReferenceImage.S3Object.Bucket}.s3.amazonaws.com/${atndReferenceImage.S3Object.Name}`
                                  : ""
                              }
                              alt="Reference"
                            />
                          </div>
                        )}
                        {attendanceStatus && (
                          <div className="attendance-status" style={{ marginTop: "10px" }}>
                            <p
                              style={{
                                color: attendanceStatus.includes("Successful") ? "green" : "red",
                                fontWeight: 500,
                              }}
                            >
                              {attendanceStatus}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="liveness_div82">
                        <FaceLivenessDetector
                          sessionId={sessionId!}
                          region="ap-south-1"
                          onAnalysisComplete={handleComparison}
                        />
                      </div>
                    )}
                  </>
                )}
                {error && <div style={{ color: "red" }}>Error: {error.message}</div>}
              </div>
            </ThemeProvider>
          )}
        </>
      ) : (
        ""
      )}
    </>
  );
};

export default AdminView;