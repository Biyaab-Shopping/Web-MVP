import search_icon from "../assests/search.png";
function Head(props) {
  const modalOpen = () => {
    props.modalOpen();
  };
  return (
    <div className="row justify-content-start py-2">
      <div onClick={modalOpen}>
        <img
          src={search_icon}
          width={50}
          height={50}
          style={{ maxWidth: "70px" }}
          alt="search_icon"
        ></img>
      </div>
    </div>
  );
}

export default Head;
