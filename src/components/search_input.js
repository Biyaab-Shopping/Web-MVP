import { Form, InputGroup } from "react-bootstrap";
import ZoomIcon from "../assests/zoom_icon.png";
import { useEffect, useState } from "react";
function Search_Input(props) {
  const { name, addButton } = props;
  const [searchValue, setSearchValue] = useState(props.searchValue);
  useEffect(() => {
    setSearchValue(props.searchValue);
  }, [props.searchValue]);

  const changePropsSearchValue = () => {
    props.setSearchValue(searchValue);
  };

  const changeValueFunc = (e) => {
    setSearchValue(e.target.value);
  };
  return (
    <div className="search_input py-2 px-1">
      <InputGroup className="">
        <Form.Control
          name={name | "input"}
          className="border-0 bg-white rounded shadow-none"
          placeholder={props.placeholder || "Search"}
          aria-label={props.placeholder || "Search"}
          aria-describedby="basic-addon2"
          value={searchValue}
          onChange={changeValueFunc}
          onKeyDown={(e) => {
            if (e.keyCode === 13) {
              changePropsSearchValue(e);
            }
          }}
        />
        <InputGroup.Text id="basic-addon2" className="border-0 bg-white">
          <div onClick={changePropsSearchValue} className="search_button">
            <img src={ZoomIcon} alt="zoom_icon" height={20}></img>
          </div>
        </InputGroup.Text>
        {addButton && (
          <InputGroup.Text
            id="basic-addon2"
            className="border-0 bg-white "
            style={{ paddingLeft: "5px" }}
          >
            {addButton}
          </InputGroup.Text>
        )}
      </InputGroup>
    </div>
  );
}

export default Search_Input;
