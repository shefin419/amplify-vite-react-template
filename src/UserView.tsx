import { useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { FaceLivenessDetector } from '@aws-amplify/ui-react-liveness';
import { Loader, ThemeProvider } from '@aws-amplify/ui-react';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import './AdminView.css';
import outputs from '../amplify_outputs.json';
// import { FiCalendar } from 'react-icons/fi';
import { FiShare2 } from "react-icons/fi";

Amplify.configure(outputs);

interface ReferenceImage {
  Bytes?: string;
  S3Object?: { Bucket: string; Name: string };
}

interface HeaderProps {
  punchType: 'IN' | 'OUT' | null;
  setPunchType: Dispatch<SetStateAction<'IN' | 'OUT' | null>>;
}

interface AuditImage extends ReferenceImage { }
type UploadStatus = ReactNode;

const UserView: React.FC<HeaderProps> = ({ setPunchType, punchType }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [atndReferenceImage, setAtndReferenceImage] = useState<ReferenceImage | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [comparisonResult, setComparisonResult] = useState('');
  const [auditImages, setAuditImages] = useState<AuditImage[]>([]);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>(null);
  const [punchRecorded, setPunchRecorded] = useState<{ type: 'IN' | 'OUT'; dateTime: string } | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<string>('');

  const [mode, setMode] = useState<"INDIVIDUAL" | "COMMON" | null>(null);
  const NoWarning = () => null;
  const loginBranch = localStorage.getItem('loginBranch');
  const host = localStorage.getItem('host');
  const uniqueUserToken = localStorage.getItem('uniqueUserToken');
  const loginUsername = localStorage.getItem('loginUsername');

  useEffect(() => {
  const savedMode = localStorage.getItem("attendanceMode");
  if (savedMode === "INDIVIDUAL" || savedMode === "COMMON") {
    setMode(savedMode);
  }
  }, []);

  const handleModeSelect = (selectedMode: "INDIVIDUAL" | "COMMON") => {
  setMode(selectedMode);
  localStorage.setItem("attendanceMode", selectedMode);
  };

  // Fetch session ID and reset states when punchType changes
  useEffect(() => {
    if (punchType) {
      const fetchSession = async () => {
        setLoading(true);
        console.log(confidence,comparisonResult,auditImages,uploadStatus);
        try {
          const res = await fetch(
            'https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getsessionid?method=createSession'
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
    }
    // Reset states when punchType changes
    setAnalysisComplete(false);
    setAuditImages([ ]);
    setAtndReferenceImage(null);
    setConfidence(null);
    setComparisonResult('');
    setUploadStatus(null);
    setPunchRecorded(null);
    setAttendanceStatus('');
    setError(null);
  }, [punchType]);

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

    const checkGeolocation = (): Promise<boolean> => {
      return new Promise((resolve) => {
        const storedGeo = localStorage.getItem('userGeo');
        if (!storedGeo) {
          setAttendanceStatus('⚠️ No stored location found');
          resolve(false);
          return;
        }

      const [storedLat, storedLon] = storedGeo.split(',').map(Number);

      if (!navigator.geolocation) {
        setAttendanceStatus('⚠️ Geolocation is not supported by this browser');
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLat = position.coords.latitude;
          const currentLon = position.coords.longitude;

          localStorage.setItem(
            'userLocation',
            JSON.stringify({
              latitude: currentLat,
              longitude: currentLon,
            })
          );

          const distance = calculateDistance(storedLat, storedLon, currentLat, currentLon);
          if (distance <= 5) {
            setAttendanceStatus('✅ Within 5 meters of designated location');
            resolve(true);
          } else {
            setAttendanceStatus(`⚠️ Outside 5-meter radius (Distance: ${distance.toFixed(2)} meters)`);
            resolve(false);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          setAttendanceStatus(`⚠️ Error getting location: ${error.message}`);
          resolve(false);
        }
      );
    });
  };

  const handleAnalysisCompleted = async () => {
    try {
      // Check if user is within 5-meter radius
      const isWithinRadius = await checkGeolocation();
      if (!isWithinRadius) {
        setAnalysisComplete(true);
        return;
      }

      const response = await fetch(
        `https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getsessionid?method=getSessionResults&sessionId=${sessionId}`
      );
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      setUploadStatus('');
      setAnalysisComplete(true);
      setAuditImages(data.auditImages || []);
      setAtndReferenceImage(data.referenceImage || null);
      setConfidence(data.confidence);

      if (data.confidence > 70) {
        await handleCompareFaces();
      } else {
        setComparisonResult('User is not live');
        setAttendanceStatus('⚠️ User is not live');
      }
    } catch (error) {
      setError(error as Error);
      setAttendanceStatus(`⚠️ Error during analysis: ${(error as Error).message}`);
    }
  };


  const handleCompareFaces = async () => {
  try {
    let url = "";
    if (mode === "INDIVIDUAL") {
      url = `https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getsessionid?method=compareWithUserIdAndBranchName&sessionId=${sessionId}&userId=${uniqueUserToken}&userCode=${loginUsername}&companyId=${host}&branchName=${loginBranch}`;
    console.log("abc")
    } else if (mode === "COMMON") {
      console.log("xyz")
      url = `https://udi6nn4bs6.execute-api.ap-south-1.amazonaws.com/dev1/getsessionid?method=compareFaceAcrossBranches&sessionId=${sessionId}&companyId=${host}`;
    }

    const response = await fetch(url);
    console.log(response,"+++++++++++++++++++");
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
      console.log(data.message,"----------",data.userCode,".....");
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
      .replace(
        /(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2}:\d{2})/,
        "$3-$2-$1 $4"
      );

    const currentDate = getCurrentDate();

    if ((data.status === "success" && data.message === "Match found") || (data.userCode!=null)) {
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
              username: loginUsername || data.userCode,
              type: punchType,
              time: formattedDateTime,
              date: currentDate,
            }),
          }
        );
        const val = await savePunchResponse.json();
        console.log(val,"///////////");
        setPunchRecorded({ type: punchType!, dateTime: formattedDateTime });
        setAttendanceStatus(
          `✔️ Clock ${punchType} Successful - Match found (Similarity: ${data.similarity}%)`
        );
      } catch (saveError) {
        console.error("Error saving punch:", saveError);
        setError(saveError as Error);
        setAttendanceStatus(
          `⚠️ Clock ${punchType} failed - Error saving punch: ${
            (saveError as Error).message
          }`
        );
      }
    } else if (data.status === "wait") {
      setAttendanceStatus("⏳ Please wait for 2 minutes...");
    } else {
      setAttendanceStatus(
        `⚠️ Clock ${punchType} failed - ${data.message || "No match found"}`
      );
    }
    setComparisonResult(data.message);
  } catch (error) {
    setError(error as Error);
    setAttendanceStatus(`⚠️ Error: ${(error as Error).message}`);
  }
};

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };


   const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "CaliCo HR",
          text: "Check out this awesome PWA feature!",
          url: "https://yourdomain.com",
        });
        console.log("Shared successfully!");
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      alert("Web Share API not supported in this browser.");
    }
  };






const handleFileShare = async () => {
    if (navigator.canShare && navigator.share) {
      try {
        // Example: create a Blob for a PDF (could also fetch an image or document from server/S3)
        const response = await fetch("/sample.pdf"); // put your file in public/ folder
        const blob = await response.blob();

        const file = new File([blob], "invoice.pdf", {
          type: "application/pdf",
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Invoice",
            text: "Here’s your invoice!",
            files: [file],
          });
          console.log("File shared successfully!");
        } else {
          alert("This file type cannot be shared.");
        }
      } catch (error) {
        console.error("Error sharing file:", error);
      }
    } else {
      alert("File sharing not supported in this browser.");
    }
  };


return (
    <div>
      <div style={{ display: "flex", justifyContent: "end", padding: "5px" }}>
        {/* <div style={{ display: "flex", gap: "5px" }}>
          <FiCalendar className="calendar-button" size={20} />
          {getCurrentDate()}
        </div> */}
        <div
              onClick={handleFileShare}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              cursor: "pointer",
              color: "#ffffffff",
              backgroundColor: "#0000ffff",   // green background
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "500",
              transition: "background 0.3s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#000000ff")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#000000ff")}
          >
            <FiShare2 size={20} />
            <span>Share File</span>
      </div>
       <>
       <button
          onClick={handleShare}
          style={{
            padding: "10px 20px",
            background: "#3110a0ff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
          }} >
          Share
      </button>       
      </>
      </div>
     
      
      {/* Step 1: Choose Mode */}
      {mode === null  ? (
        <div className="admin-container1">
          <p className="attandence-header-font-style">Select Mode</p>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
           <button className="mode-button" onClick={() => handleModeSelect("INDIVIDUAL")}>
              Individual
            </button>
            <button className="mode-button" onClick={() => handleModeSelect("COMMON")}>
              Common
            </button>
          </div>
        </div>
      ) : punchType === null ? (
        /* Step 2: Choose Punch Type */
        <div className="admin-container1">
          <p className="attandence-header-font-style">Select Attendance Action ({mode})</p>
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
        /* Step 3: Existing Clock In/Out + Face Liveness */
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
                    {punchRecorded && (
                      <div style={{ marginTop: "10px" }}>
                        <p>Punch Type: {punchRecorded.type}</p>
                        <p>Punching Date and Time: {punchRecorded.dateTime}</p>
                      </div>
                    )}
                    {attendanceStatus && (
                      <div className="attendance-status" style={{ marginTop: "10px" }}>
                        <p
                          style={{
                            color:
                              attendanceStatus.includes("Successful") ||
                              attendanceStatus.includes("Within")
                                ? "green"
                                : "red",
                            fontWeight: 500,
                          }}
                        >
                          {attendanceStatus}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  sessionId && (
                    <div className="liveness_div">
                      <FaceLivenessDetector
                        sessionId={sessionId}
                        region="ap-south-1"
                        onAnalysisComplete={handleAnalysisCompleted}
                        components={{ PhotosensitiveWarning: NoWarning }}
                      />
                    </div>
                  )
                )}
              </>
            )}
            {error && (
              <div style={{ color: "red", marginTop: "10px" }}>
                Error: {error.message}
              </div>
            )}
          </div>
        </ThemeProvider>
      )}
    </div>
  );
};
export default UserView;
























